import requests
import sys
from datetime import datetime, date
import json

class FinancialAppAPITester:
    def __init__(self, base_url="https://smart-finances-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'categories': [],
            'transactions': [],
            'goals': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_dashboard_summary(self):
        """Test dashboard summary endpoint"""
        success, response = self.run_test(
            "Dashboard Summary",
            "GET",
            "dashboard/summary",
            200
        )
        if success:
            required_keys = ['total_balance', 'total_income', 'total_expenses', 
                           'monthly_balance', 'monthly_income', 'monthly_expenses',
                           'category_spending', 'recent_transactions']
            missing_keys = [key for key in required_keys if key not in response]
            if missing_keys:
                print(f"   ⚠️  Missing keys in response: {missing_keys}")
            else:
                print(f"   ✅ All required keys present")
        return success

    def test_get_categories(self):
        """Test get categories endpoint"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        return success, response

    def test_create_category(self, name, category_type, color="#3B82F6"):
        """Test create category endpoint"""
        success, response = self.run_test(
            f"Create Category ({name})",
            "POST",
            "categories",
            200,
            data={
                "name": name,
                "type": category_type,
                "color": color,
                "limit_enabled": False
            }
        )
        if success and 'id' in response:
            self.created_ids['categories'].append(response['id'])
            return True, response['id']
        return False, None

    def test_get_transactions(self):
        """Test get transactions endpoint"""
        success, response = self.run_test(
            "Get Transactions",
            "GET",
            "transactions",
            200
        )
        return success, response

    def test_create_transaction(self, description, amount, transaction_type, category_id):
        """Test create transaction endpoint"""
        success, response = self.run_test(
            f"Create Transaction ({description})",
            "POST",
            "transactions",
            200,
            data={
                "description": description,
                "amount": amount,
                "type": transaction_type,
                "category_id": category_id,
                "date": date.today().isoformat()
            }
        )
        if success and 'id' in response:
            self.created_ids['transactions'].append(response['id'])
            return True, response['id']
        return False, None

    def test_get_goals(self):
        """Test get goals endpoint"""
        success, response = self.run_test(
            "Get Goals",
            "GET",
            "goals",
            200
        )
        return success, response

    def test_create_goal(self, title, target_amount, description=None):
        """Test create goal endpoint"""
        goal_data = {
            "title": title,
            "target_amount": target_amount
        }
        if description:
            goal_data["description"] = description

        success, response = self.run_test(
            f"Create Goal ({title})",
            "POST",
            "goals",
            200,
            data=goal_data
        )
        if success and 'id' in response:
            self.created_ids['goals'].append(response['id'])
            return True, response['id']
        return False, None

    def test_get_alerts(self):
        """Test get alerts endpoint"""
        success, response = self.run_test(
            "Get Alerts",
            "GET",
            "alerts",
            200
        )
        return success, response

    def cleanup_created_data(self):
        """Clean up test data"""
        print(f"\n🧹 Cleaning up test data...")
        
        # Delete created transactions
        for transaction_id in self.created_ids['transactions']:
            self.run_test(
                f"Delete Transaction {transaction_id}",
                "DELETE",
                f"transactions/{transaction_id}",
                200
            )
        
        # Delete created goals
        for goal_id in self.created_ids['goals']:
            self.run_test(
                f"Delete Goal {goal_id}",
                "DELETE",
                f"goals/{goal_id}",
                200
            )
        
        # Delete created categories
        for category_id in self.created_ids['categories']:
            self.run_test(
                f"Delete Category {category_id}",
                "DELETE",
                f"categories/{category_id}",
                200
            )

def main():
    print("🚀 Starting Financial App API Tests")
    print("=" * 50)
    
    tester = FinancialAppAPITester()
    
    try:
        # Test basic endpoints first
        print("\n📊 Testing Dashboard and Data Retrieval...")
        tester.test_dashboard_summary()
        
        # Test categories
        print("\n📂 Testing Categories...")
        categories_success, existing_categories = tester.test_get_categories()
        
        # Create a test category
        test_category_success, test_category_id = tester.test_create_category(
            "Test Category", "expense", "#FF6B6B"
        )
        
        # Test transactions
        print("\n💰 Testing Transactions...")
        transactions_success, existing_transactions = tester.test_get_transactions()
        
        # Create a test transaction if we have a category
        if test_category_id:
            tester.test_create_transaction(
                "Test Transaction", 100.50, "expense", test_category_id
            )
        
        # Test goals
        print("\n🎯 Testing Goals...")
        goals_success, existing_goals = tester.test_get_goals()
        tester.test_create_goal("Test Goal", 5000.0, "Test goal description")
        
        # Test alerts
        print("\n🔔 Testing Alerts...")
        tester.test_get_alerts()
        
        # Test dashboard again to see if new data appears
        print("\n📊 Testing Dashboard with New Data...")
        tester.test_dashboard_summary()
        
    except Exception as e:
        print(f"❌ Unexpected error during testing: {str(e)}")
    
    finally:
        # Clean up test data
        tester.cleanup_created_data()
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())