#!/bin/bash

# Simple manual deployment script for r/factchecker
# This deploys just the essential components: Lambda + API Gateway

set -e

echo "🚀 Manual deployment of r/factchecker..."

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ Loaded environment variables from .env"
fi

# Set variables
FUNCTION_NAME="r-factchecker"
ROLE_NAME="r-factchecker-lambda-role"
API_NAME="r-factchecker-api"

echo "📦 Creating deployment package..."
cd aws-lambda
zip -r ../lambda-deployment.zip . -x "node_modules/*" ".aws-sam/*" "*.yaml" "*.toml"
cd ..

echo "🔑 Creating IAM role..."
aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file://aws-lambda/trust-policy.json \
    --no-cli-pager || echo "Role may already exist"

echo "🔗 Attaching execution policy..."
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
    --no-cli-pager

# Wait for role to be ready
echo "⏳ Waiting for IAM role to be ready..."
sleep 10

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

echo "λ Creating Lambda function..."
aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs18.x \
    --role $ROLE_ARN \
    --handler factChecker.handler \
    --zip-file fileb://lambda-deployment.zip \
    --timeout 30 \
    --memory-size 512 \
    --no-cli-pager || aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-deployment.zip \
    --no-cli-pager

echo "🌐 Creating API Gateway..."
API_ID=$(aws apigateway create-rest-api \
    --name $API_NAME \
    --description "API for r/factchecker" \
    --query 'id' \
    --output text) || echo "API may already exist"

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    API_ID=$(aws apigateway get-rest-apis \
        --query "items[?name=='$API_NAME'].id" \
        --output text)
fi

echo "📋 API Gateway ID: $API_ID"

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?path==`/`].id' \
    --output text)

# Create /check resource
RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part check \
    --query 'id' \
    --output text) || \
RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?pathPart==`check`].id' \
    --output text)

# Create POST method
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE \
    --no-cli-pager || echo "Method may already exist"

# Create OPTIONS method for CORS
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE \
    --no-cli-pager || echo "OPTIONS method may already exist"

# Set up Lambda integration
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:${AWS_DEFAULT_REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${AWS_DEFAULT_REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}/invocations" \
    --no-cli-pager || echo "Integration may already exist"

# Give API Gateway permission to invoke Lambda
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id api-gateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${AWS_DEFAULT_REGION}:${ACCOUNT_ID}:${API_ID}/*/*" \
    --no-cli-pager || echo "Permission may already exist"

# Deploy API
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --no-cli-pager

# Clean up
rm -f lambda-deployment.zip

echo "✅ Deployment complete!"
echo ""
echo "🔗 Your API endpoint:"
echo "https://${API_ID}.execute-api.${AWS_DEFAULT_REGION}.amazonaws.com/prod/check"
echo ""
echo "📝 Update your browser extension with this endpoint URL!"
