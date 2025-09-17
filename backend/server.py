from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, date
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: TransactionType
    limit_enabled: bool = False
    monthly_limit: Optional[float] = None
    color: str = "#3B82F6"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    type: TransactionType
    limit_enabled: bool = False
    monthly_limit: Optional[float] = None
    color: str = "#3B82F6"

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    amount: float
    type: TransactionType
    category_id: str
    date: date
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    description: str
    amount: float
    type: TransactionType
    category_id: str
    date: date

class Goal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    target_amount: float
    current_amount: float = 0
    target_date: Optional[date] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    target_amount: float
    target_date: Optional[date] = None

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category_id: str
    message: str
    amount_spent: float
    limit_amount: float
    percentage: float
    date: date
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

def prepare_for_mongo(data):
    if isinstance(data, dict):
        if isinstance(data.get('date'), date):
            data['date'] = data['date'].isoformat()
        if isinstance(data.get('target_date'), date):
            data['target_date'] = data['target_date'].isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item, dict):
        if isinstance(item.get('date'), str):
            item['date'] = datetime.fromisoformat(item['date']).date()
        if isinstance(item.get('target_date'), str):
            item['target_date'] = datetime.fromisoformat(item['target_date']).date()
    return item

# Categories endpoints
@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate):
    category_dict = prepare_for_mongo(category.dict())
    category_obj = Category(**category_dict)
    await db.categories.insert_one(prepare_for_mongo(category_obj.dict()))
    return category_obj

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find().to_list(1000)
    return [Category(**parse_from_mongo(category)) for category in categories]

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category: CategoryCreate):
    category_dict = prepare_for_mongo(category.dict())
    result = await db.categories.update_one(
        {"id": category_id}, 
        {"$set": category_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    updated_category = await db.categories.find_one({"id": category_id})
    return Category(**parse_from_mongo(updated_category))

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# Transactions endpoints
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction: TransactionCreate):
    transaction_dict = prepare_for_mongo(transaction.dict())
    transaction_obj = Transaction(**transaction_dict)
    await db.transactions.insert_one(prepare_for_mongo(transaction_obj.dict()))
    
    # Check for limit alerts if it's an expense
    if transaction.type == TransactionType.EXPENSE:
        await check_category_limits(transaction.category_id, transaction.date)
    
    return transaction_obj

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions():
    transactions = await db.transactions.find().sort("date", -1).to_list(1000)
    return [Transaction(**parse_from_mongo(transaction)) for transaction in transactions]

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, transaction: TransactionCreate):
    transaction_dict = prepare_for_mongo(transaction.dict())
    result = await db.transactions.update_one(
        {"id": transaction_id}, 
        {"$set": transaction_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    updated_transaction = await db.transactions.find_one({"id": transaction_id})
    return Transaction(**parse_from_mongo(updated_transaction))

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}

# Goals endpoints
@api_router.post("/goals", response_model=Goal)
async def create_goal(goal: GoalCreate):
    goal_dict = prepare_for_mongo(goal.dict())
    goal_obj = Goal(**goal_dict)
    await db.goals.insert_one(prepare_for_mongo(goal_obj.dict()))
    return goal_obj

@api_router.get("/goals", response_model=List[Goal])
async def get_goals():
    goals = await db.goals.find().to_list(1000)
    return [Goal(**parse_from_mongo(goal)) for goal in goals]

@api_router.put("/goals/{goal_id}", response_model=Goal)
async def update_goal(goal_id: str, goal: GoalCreate):
    goal_dict = prepare_for_mongo(goal.dict())
    result = await db.goals.update_one(
        {"id": goal_id}, 
        {"$set": goal_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    updated_goal = await db.goals.find_one({"id": goal_id})
    return Goal(**parse_from_mongo(updated_goal))

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str):
    result = await db.goals.delete_one({"id": goal_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted successfully"}

# Alerts endpoints
@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts():
    alerts = await db.alerts.find().sort("created_at", -1).to_list(100)
    return [Alert(**parse_from_mongo(alert)) for alert in alerts]

@api_router.put("/alerts/{alert_id}/read")
async def mark_alert_as_read(alert_id: str):
    result = await db.alerts.update_one(
        {"id": alert_id}, 
        {"$set": {"is_read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert marked as read"}

# Dashboard endpoints
@api_router.get("/dashboard/summary")
async def get_dashboard_summary():
    from collections import defaultdict
    import calendar
    
    now = datetime.now(timezone.utc)
    current_date = now.date()
    current_month = current_date.replace(day=1)
    current_year = current_date.replace(month=1, day=1)
    
    # Get all transactions
    transactions_raw = await db.transactions.find().to_list(10000)
    transactions = []
    for t in transactions_raw:
        # Remove MongoDB ObjectId and convert dates
        t.pop('_id', None)
        parsed_t = parse_from_mongo(t)
        transactions.append(parsed_t)
    
    # Calculate totals
    total_income = sum(t['amount'] for t in transactions if t['type'] == 'income')
    total_expenses = sum(t['amount'] for t in transactions if t['type'] == 'expense')
    balance = total_income - total_expenses
    
    # Monthly data
    monthly_income = sum(t['amount'] for t in transactions if t['type'] == 'income' and t['date'] >= current_month)
    monthly_expenses = sum(t['amount'] for t in transactions if t['type'] == 'expense' and t['date'] >= current_month)
    monthly_balance = monthly_income - monthly_expenses
    
    # Category spending this month
    category_spending = defaultdict(float)
    for t in transactions:
        if t['type'] == 'expense' and t['date'] >= current_month:
            category_spending[t['category_id']] += t['amount']
    
    # Get categories
    categories_raw = await db.categories.find().to_list(1000)
    categories = []
    categories_dict = {}
    for c in categories_raw:
        c.pop('_id', None)  # Remove ObjectId
        categories.append(c)
        categories_dict[c['id']] = c
    
    # Format category spending with names
    category_data = []
    for cat_id, amount in category_spending.items():
        if cat_id in categories_dict:
            category_data.append({
                'category': categories_dict[cat_id]['name'],
                'amount': amount,
                'color': categories_dict[cat_id]['color']
            })
    
    # Get recent transactions (last 10) - clean for JSON serialization
    recent_transactions = sorted(transactions, key=lambda x: x['date'], reverse=True)[:10]
    clean_recent_transactions = []
    for t in recent_transactions:
        clean_t = dict(t)  # Make a copy
        # Convert date to string for JSON serialization
        if isinstance(clean_t.get('date'), date):
            clean_t['date'] = clean_t['date'].isoformat()
        if isinstance(clean_t.get('created_at'), datetime):
            clean_t['created_at'] = clean_t['created_at'].isoformat()
        
        if t['category_id'] in categories_dict:
            clean_t['category_name'] = categories_dict[t['category_id']]['name']
        clean_recent_transactions.append(clean_t)
    
    return {
        "total_balance": float(balance),
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "monthly_balance": float(monthly_balance),
        "monthly_income": float(monthly_income),
        "monthly_expenses": float(monthly_expenses),
        "category_spending": category_data,
        "recent_transactions": clean_recent_transactions
    }

async def check_category_limits(category_id: str, transaction_date: date):
    # Get category
    category = await db.categories.find_one({"id": category_id})
    if not category or not category.get('limit_enabled') or not category.get('monthly_limit'):
        return
    
    # Calculate month start
    month_start = transaction_date.replace(day=1)
    
    # Get month expenses for this category
    month_expenses = await db.transactions.find({
        "category_id": category_id,
        "type": "expense",
        "date": {"$gte": month_start.isoformat()}
    }).to_list(1000)
    
    total_spent = sum(t['amount'] for t in month_expenses)
    limit = category['monthly_limit']
    percentage = (total_spent / limit) * 100
    
    # Create alert if over 80% or 100%
    if percentage >= 80:
        alert_message = f"Atenção! Você gastou {percentage:.1f}% do limite na categoria {category['name']}"
        if percentage >= 100:
            alert_message = f"Limite excedido! Você gastou R$ {total_spent:.2f} do limite de R$ {limit:.2f} na categoria {category['name']}"
        
        alert = Alert(
            category_id=category_id,
            message=alert_message,
            amount_spent=total_spent,
            limit_amount=limit,
            percentage=percentage,
            date=transaction_date
        )
        
        await db.alerts.insert_one(prepare_for_mongo(alert.dict()))

# Export/Import endpoints
@api_router.get("/export/data")
async def export_all_data():
    """Export all user data in JSON format"""
    try:
        # Get all data
        categories_raw = await db.categories.find().to_list(10000)
        transactions_raw = await db.transactions.find().to_list(10000)
        goals_raw = await db.goals.find().to_list(10000)
        alerts_raw = await db.alerts.find().to_list(10000)
        
        # Clean data (remove MongoDB _id and parse dates)
        categories = []
        for c in categories_raw:
            c.pop('_id', None)
            categories.append(parse_from_mongo(c))
        
        transactions = []
        for t in transactions_raw:
            t.pop('_id', None)
            parsed_t = parse_from_mongo(t)
            # Convert dates to ISO strings for JSON serialization
            if isinstance(parsed_t.get('date'), date):
                parsed_t['date'] = parsed_t['date'].isoformat()
            if isinstance(parsed_t.get('created_at'), datetime):
                parsed_t['created_at'] = parsed_t['created_at'].isoformat()
            transactions.append(parsed_t)
        
        goals = []
        for g in goals_raw:
            g.pop('_id', None)
            parsed_g = parse_from_mongo(g)
            # Convert dates to ISO strings for JSON serialization
            if isinstance(parsed_g.get('target_date'), date):
                parsed_g['target_date'] = parsed_g['target_date'].isoformat()
            if isinstance(parsed_g.get('created_at'), datetime):
                parsed_g['created_at'] = parsed_g['created_at'].isoformat()
            goals.append(parsed_g)
        
        alerts = []
        for a in alerts_raw:
            a.pop('_id', None)
            parsed_a = parse_from_mongo(a)
            # Convert dates to ISO strings for JSON serialization
            if isinstance(parsed_a.get('date'), date):
                parsed_a['date'] = parsed_a['date'].isoformat()
            if isinstance(parsed_a.get('created_at'), datetime):
                parsed_a['created_at'] = parsed_a['created_at'].isoformat()
            alerts.append(parsed_a)
        
        # Create export data structure
        export_data = {
            "export_info": {
                "export_date": datetime.now(timezone.utc).isoformat(),
                "app_name": "Controle Financeiro",
                "version": "1.0"
            },
            "data": {
                "categories": categories,
                "transactions": transactions,
                "goals": goals,
                "alerts": alerts
            },
            "summary": {
                "total_categories": len(categories),
                "total_transactions": len(transactions),
                "total_goals": len(goals),
                "total_alerts": len(alerts)
            }
        }
        
        return export_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting data: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()