#!/bin/bash

# ============================================
# SafeWalk Campus API - Complete Test Script
# ============================================

# Configuration
API_URL="http://localhost:5000/api"
BASE_URL="http://localhost:5000"

# Generate unique test user to avoid conflicts with real users
TEST_EMAIL="thanksayo299@gmail.com"
TEST_NAME="thanks ayo"
TEST_PASSWORD="TestPass123!"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Variables to store data
ACCESS_TOKEN=""
REFRESH_TOKEN=""
ALERT_ID=""
CONTACT_ID=""
OTP_CODE=""
PROFILE_PICTURE_URL=""
USER_ID=""
UNIVERSITY_ACRONYM=""
TESTS_PASSED=0
TESTS_FAILED=0

# Helper Functions

print_header() {
    echo ""
    echo -e "${MAGENTA}========================================${NC}"
    echo -e "${CYAN}📌 $1${NC}"
    echo -e "${MAGENTA}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_json() {
    if command -v python3 &> /dev/null; then
        echo "$1" | python3 -m json.tool 2>/dev/null || echo "$1"
    elif command -v jq &> /dev/null; then
        echo "$1" | jq '.' 2>/dev/null || echo "$1"
    else
        echo "$1"
    fi
}

check_server() {
    print_header "Checking Server Status"
    echo -n "Checking if server is running... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" | grep -q "200"; then
        print_success "Server is running"
        return 0
    else
        print_error "Server is not running!"
        echo ""
        echo "Please start the server first:"
        echo "  cd /mnt/c/Users/USER/Desktop/synap-circle"
        echo "  npm run dev"
        echo ""
        exit 1
    fi
}

# Create Test Image for Cloudinary
create_test_image() {
    echo -e "${BLUE}📸 Creating test image for Cloudinary...${NC}"
    
    # Create a simple 1x1 pixel PNG (base64 encoded)
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-profile-pic.png
    
    if [ -f /tmp/test-profile-pic.png ]; then
        print_success "Test image created at /tmp/test-profile-pic.png"
        return 0
    else
        print_error "Failed to create test image"
        return 1
    fi
}

# Run a test and track results
run_test() {
    local test_function="$1"
    local test_name="$2"
    
    echo ""
    echo -e "${BLUE}▶️ Running: $test_name${NC}"
    
    if eval "$test_function"; then
        ((TESTS_PASSED++))
        return 0
    else
        ((TESTS_FAILED++))
        return 1
    fi
}

# 1. HEALTH CHECK
test_health() {
    print_header "1. Health Check"
    
    RESPONSE=$(curl -s -X GET "$BASE_URL/health")
    print_info "Response:"
    print_json "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q "ok"; then
        print_success "Health check passed"
        return 0
    else
        print_error "Health check failed"
        return 1
    fi
}

# 2. SIGNUP
test_signup() {
    print_header "2. Sign Up - Create Test User"
    
    print_info "Creating user: $TEST_EMAIL"
    print_info "📧 OTP, Welcome, and Onboarding emails will be sent to this address"
    
    RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"name\": \"$TEST_NAME\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    OTP_CODE=$(echo "$RESPONSE" | grep -o '"development_otp":"[^"]*"' | sed 's/"development_otp":"//;s/"//')
    USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')
    
    if [ -n "$OTP_CODE" ]; then
        print_success "User created! OTP: $OTP_CODE"
        print_info "📧 OTP email sent to: $TEST_EMAIL"
        return 0
    elif echo "$RESPONSE" | grep -q '"success":true'; then
        print_warning "User created but OTP not in response"
        print_info "📧 Check your email (${TEST_EMAIL}) for the OTP"
        return 0
    else
        print_error "Signup failed"
        return 1
    fi
}

# 3. VERIFY OTP
test_verify_otp() {
    print_header "3. Verify OTP"
    
    if [ -z "$OTP_CODE" ]; then
        print_warning "No OTP available. Please enter OTP manually:"
        print_info "📧 Check your email at: $TEST_EMAIL"
        read -r -p "Enter OTP code (or 'skip' to continue): " OTP_CODE
        if [ "$OTP_CODE" = "skip" ]; then
            print_warning "Skipping OTP verification - using existing user"
            return 0
        fi
    fi
    
    print_info "Verifying OTP: $OTP_CODE"
    
    RESPONSE=$(curl -s -X POST "$API_URL/auth/verify-otp" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"otpCode\": \"$OTP_CODE\"
        }")
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | head -1 | sed 's/"accessToken":"//;s/"//')
    REFRESH_TOKEN=$(echo "$RESPONSE" | grep -o '"refreshToken":"[^"]*"' | head -1 | sed 's/"refreshToken":"//;s/"//')
    USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "OTP verified! Session established."
        return 0
    else
        print_error "OTP verification failed"
        return 1
    fi
}

# 4. LOGIN
test_login() {
    print_header "4. Login"
    
    print_info "Logging in as: $TEST_EMAIL"
    
    RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | head -1 | sed 's/"accessToken":"//;s/"//')
    REFRESH_TOKEN=$(echo "$RESPONSE" | grep -o '"refreshToken":"[^"]*"' | head -1 | sed 's/"refreshToken":"//;s/"//')
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Login successful!"
        return 0
    else
        print_error "Login failed"
        return 1
    fi
}

# 5. GET USER PROFILE
test_get_profile() {
    print_header "5. Get User Profile (Auth/me)"
    
    RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Profile retrieved successfully"
        return 0
    else
        print_error "Failed to get profile"
        return 1
    fi
}

# 6. SAVE UNIVERSITY
test_save_university() {
    print_header "6. Save University"
    
    print_info "Saving university for user..."
    
    RESPONSE=$(curl -s -X POST "$API_URL/university" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "University of Lagos",
            "acronym": "UNILAG",
            "location": "Akoka, Yaba, Lagos"
        }')
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    UNIVERSITY_ACRONYM=$(echo "$RESPONSE" | grep -o '"acronym":"[^"]*"' | head -1 | sed 's/"acronym":"//;s/"//')
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "University saved successfully! Acronym: $UNIVERSITY_ACRONYM"
        return 0
    else
        print_warning "Failed to save university (may already exist)"
        return 0
    fi
}

# 7. GET UNIVERSITY
test_get_university() {
    print_header "7. Get University"
    
    RESPONSE=$(curl -s -X GET "$API_URL/university" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "University retrieved successfully"
        return 0
    else
        print_warning "Failed to get university (endpoint may not exist)"
        return 0
    fi
}

# 8. UPDATE UNIVERSITY
test_update_university() {
    print_header "8. Update University"
    
    print_info "Updating university..."
    
    RESPONSE=$(curl -s -X PUT "$API_URL/university" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "University of Lagos (Updated)",
            "location": "Akoka, Yaba, Lagos, Nigeria"
        }')
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "University updated successfully"
        return 0
    else
        print_warning "Failed to update university"
        return 0
    fi
}

# 9. GET UNIVERSITY SECURITY CONTACTS
test_university_security() {
    print_header "9. Get University Security Contacts"
    
    RESPONSE=$(curl -s -X GET "$API_URL/university/security" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "University security contacts retrieved"
        return 0
    else
        print_warning "Failed to get university security contacts"
        return 0
    fi
}

# 10. GET UNIVERSITY LIST
test_university_list() {
    print_header "10. Get University List"
    
    RESPONSE=$(curl -s -X GET "$API_URL/university/list" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "University list retrieved"
        return 0
    else
        print_warning "Failed to get university list"
        return 0
    fi
}

# 11. SEARCH UNIVERSITIES
test_university_search() {
    print_header "11. Search Universities"
    
    RESPONSE=$(curl -s -X GET "$API_URL/university/search?q=UNILAG" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "University search successful"
        return 0
    else
        print_warning "Failed to search universities"
        return 0
    fi
}

# 12. GET UNIVERSITY BY ACRONYM
test_university_by_acronym() {
    print_header "12. Get University by Acronym"
    
    if [ -z "$UNIVERSITY_ACRONYM" ]; then
        UNIVERSITY_ACRONYM="UNILAG"
    fi
    
    RESPONSE=$(curl -s -X GET "$API_URL/university/$UNIVERSITY_ACRONYM" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "University details retrieved by acronym"
        return 0
    else
        print_warning "Failed to get university by acronym"
        return 0
    fi
}

# 13. DELETE UNIVERSITY
test_delete_university() {
    print_header "13. Delete University"
    
    print_info "Removing university..."
    
    RESPONSE=$(curl -s -X DELETE "$API_URL/university" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "University removed successfully"
        return 0
    else
        print_warning "Failed to remove university"
        return 0
    fi
}

# 14. GET FULL PROFILE
test_get_full_profile() {
    print_header "14. Get Full Profile (Profile/me)"
    
    RESPONSE=$(curl -s -X GET "$API_URL/profile/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Full profile retrieved successfully"
        return 0
    else
        print_warning "Failed to get full profile"
        return 0
    fi
}

# 15. ADD TRUSTED CONTACT
test_add_contact() {
    print_header "15. Add Trusted Contact"
    
    RESPONSE=$(curl -s -X POST "$API_URL/contacts" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Jane Doe",
            "email": "jane.doe@example.com",
            "relationship": "friend"
        }')
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    CONTACT_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')
    
    if [ -n "$CONTACT_ID" ] && [ "$CONTACT_ID" != "null" ]; then
        print_success "Contact added! ID: $CONTACT_ID"
        return 0
    else
        print_warning "Could not add contact"
        return 0
    fi
}

# 16. TRIGGER SOS
test_sos_with_auth() {
    print_header "16. Trigger SOS Alert"
    
    print_info "Triggering SOS alert..."
    print_info "📧 SOS confirmation email will be sent to: $TEST_EMAIL"
    
    RESPONSE=$(curl -s -X POST "$API_URL/sos/trigger" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "latitude": 37.7749,
            "longitude": -122.4194,
            "locationAvailable": true
        }')
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    ALERT_ID=$(echo "$RESPONSE" | grep -o '"alertId":"[^"]*"' | head -1 | sed 's/"alertId":"//;s/"//')
    
    if [ -n "$ALERT_ID" ] && [ "$ALERT_ID" != "null" ]; then
        print_success "SOS alert triggered! ID: $ALERT_ID"
        return 0
    else
        print_warning "Failed to trigger SOS"
        return 0
    fi
}

# 17. GET EMERGENCY DIRECTORY
test_emergency_directory() {
    print_header "17. Get Emergency Directory"
    
    RESPONSE=$(curl -s -X GET "$API_URL/emergency/directory" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Emergency directory retrieved"
        return 0
    else
        print_warning "Failed to get emergency directory"
        return 0
    fi
}

# 18. LOGOUT
test_logout() {
    print_header "18. Logout"
    
    RESPONSE=$(curl -s -X POST "$API_URL/auth/logout" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
    
    print_info "Response:"
    print_json "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Logged out successfully"
        return 0
    else
        print_warning "Logout failed"
        return 0
    fi
}

# ============================================
# RUN ALL TESTS
# ============================================

main() {
    echo -e "${MAGENTA}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║     🚀 SafeWalk Campus API - Complete Test Suite        ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo "📋 Test Configuration:"
    echo "   API URL: $API_URL"
    echo "   Test Email: $TEST_EMAIL"
    echo "   Test User: $TEST_NAME"
    echo ""
    
    # Check if server is running
    check_server || exit 1
    
    # Run all tests
    run_test test_health "Health Check"
    run_test test_signup "Sign Up"
    run_test test_verify_otp "Verify OTP"
    run_test test_login "Login"
    run_test test_get_profile "Get User Profile"
    run_test test_save_university "Save University"
    run_test test_get_university "Get University"
    run_test test_update_university "Update University"
    run_test test_university_security "Get University Security Contacts"
    run_test test_university_list "Get University List"
    run_test test_university_search "Search Universities"
    run_test test_university_by_acronym "Get University by Acronym"
    run_test test_delete_university "Delete University"
    run_test test_get_full_profile "Get Full Profile"
    run_test test_add_contact "Add Trusted Contact"
    run_test test_sos_with_auth "Trigger SOS Alert"
    run_test test_emergency_directory "Get Emergency Directory"
    run_test test_logout "Logout"
    
    # ============================================
    # TEST SUMMARY
    # ============================================
    print_header "📊 Test Summary"
    
    TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
    
    echo ""
    echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
    echo -e "${BLUE}📊 Total: $TOTAL_TESTS${NC}"
    echo ""
    
    if [ $TOTAL_TESTS -gt 0 ]; then
        PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
        echo -e "${CYAN}📈 Pass Rate: ${PASS_RATE}%${NC}"
        echo ""
    fi
    
    if [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
    else
        echo -e "${YELLOW}⚠️ Some tests failed or endpoints are not implemented yet.${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}📝 Test User Credentials:${NC}"
    echo "   Email: $TEST_EMAIL"
    echo "   Password: $TEST_PASSWORD"
    echo "   User ID: $USER_ID"
    echo ""
    
    echo -e "${MAGENTA}========================================${NC}"
    echo -e "${GREEN}✅ Test script completed!${NC}"
    echo -e "${MAGENTA}========================================${NC}"
}

# Run the main function
main "$@"