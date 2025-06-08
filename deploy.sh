#!/bin/bash

# MeetMe Deployment Script
# This script helps deploy the application to production

set -e

echo "🚀 MeetMe Deployment Script"
echo "=========================="

# Check if required tools are installed
check_requirements() {
    echo "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed"
        exit 1
    fi
    
    echo "✅ All requirements satisfied"
}

# Deploy frontend to Vercel
deploy_frontend() {
    echo -e "\n📦 Deploying Frontend to Vercel..."
    cd frontend
    
    # Install Vercel CLI if not installed
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Build the frontend
    echo "Building frontend..."
    npm install
    npm run build
    
    # Deploy to Vercel
    echo "Deploying to Vercel..."
    vercel --prod
    
    cd ..
    echo "✅ Frontend deployed successfully"
}

# Deploy backend to Railway
deploy_backend() {
    echo -e "\n🚂 Deploying Backend to Railway..."
    cd backend
    
    # Install Railway CLI if not installed
    if ! command -v railway &> /dev/null; then
        echo "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Deploy to Railway
    echo "Deploying to Railway..."
    railway up
    
    cd ..
    echo "✅ Backend deployed successfully"
}

# Run pre-deployment checks
pre_deploy_checks() {
    echo -e "\n🔍 Running pre-deployment checks..."
    
    # Check for .env files
    if [ ! -f "backend/.env.production" ]; then
        echo "⚠️  Warning: backend/.env.production not found"
        echo "   Please create it from backend/.env.example"
    fi
    
    if [ ! -f "frontend/.env.production" ]; then
        echo "⚠️  Warning: frontend/.env.production not found"
        echo "   Please create it from frontend/.env.example"
    fi
    
    # Run linting
    echo "Running ESLint..."
    cd frontend
    npm run lint || true
    cd ..
    
    echo "✅ Pre-deployment checks complete"
}

# Main deployment flow
main() {
    check_requirements
    
    echo -e "\nWhat would you like to deploy?"
    echo "1) Frontend only"
    echo "2) Backend only"
    echo "3) Both (Full deployment)"
    echo "4) Run pre-deployment checks only"
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            pre_deploy_checks
            deploy_frontend
            ;;
        2)
            pre_deploy_checks
            deploy_backend
            ;;
        3)
            pre_deploy_checks
            deploy_frontend
            deploy_backend
            ;;
        4)
            pre_deploy_checks
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
    
    echo -e "\n🎉 Deployment complete!"
    echo "Don't forget to:"
    echo "- Update your DNS records"
    echo "- Test all features in production"
    echo "- Monitor error logs"
    echo "- Set up backups"
}

# Run the script
main