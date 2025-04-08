from dataclasses import dataclass
from datetime import datetime, timedelta
import sqlite3
from typing import List, Optional
import numpy as np
from sklearn.linear_model import LogisticRegression
import pandas as pd
from pathlib import Path


@dataclass
class Medicine:
    name: str
    batch_no: str
    mfg_date: datetime
    exp_date: datetime
    chemical_composition: str
    temperature: float
    humidity: float
    quality_status: str = "Unknown"

    def assess_quality(self) -> str:
        if self.temperature > 30 or self.humidity > 70:
            self.quality_status = "Poor"
        elif self.temperature < 15 or self.humidity < 20:
            self.quality_status = "Critical"
        else:
            self.quality_status = "Good"
        return self.quality_status


class DrugMonitoringSystem:
    def __init__(self, db_path: str = "drug_inventory.db"):
        self.db_path = Path(db_path)
        self.medicines: List[Medicine] = []
        self.quality_model = self._train_quality_model()
        self._setup_database()

    def _train_quality_model(self) -> LogisticRegression:
        X = np.array([[25, 40], [32, 75], [20, 50], [35, 80], [15, 30]])
        y = np.array([1, 0, 1, 0, 1])
        model = LogisticRegression()
        model.fit(X, y)
        return model

    def _setup_database(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS drugs (
                    drug_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    batch_number TEXT UNIQUE NOT NULL,
                    supplier_id INTEGER,
                    quantity INTEGER NOT NULL CHECK(quantity >= 0),
                    expiry_date DATE NOT NULL,
                    location TEXT NOT NULL,
                    status TEXT CHECK(status IN ('In Stock', 'Out of Stock', 'Expired')),
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
                );

                CREATE TABLE IF NOT EXISTS suppliers (
                    supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    contact_name TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    address TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS supply_chain (
                    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    drug_id INTEGER NOT NULL,
                    supplier_id INTEGER NOT NULL,
                    transaction_type TEXT CHECK(transaction_type IN ('Received', 'Distributed')),
                    quantity INTEGER NOT NULL CHECK(quantity > 0),
                    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    destination TEXT,
                    FOREIGN KEY (drug_id) REFERENCES drugs(drug_id),
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
                );

                CREATE TABLE IF NOT EXISTS monitoring_logs (
                    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    drug_id INTEGER NOT NULL,
                    temperature REAL NOT NULL,
                    humidity REAL NOT NULL,
                    quality_status TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (drug_id) REFERENCES drugs(drug_id)
                );
            """)

    def add_medicine(self, medicine: Medicine):
        self.medicines.append(medicine)
        self._log_medicine_status(medicine)

    def _log_medicine_status(self, medicine: Medicine):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO monitoring_logs (drug_id, temperature, humidity, quality_status)
                VALUES (
                    (SELECT drug_id FROM drugs WHERE batch_number = ?),
                    ?, ?, ?
                )
            """, (medicine.batch_no, medicine.temperature, medicine.humidity, medicine.quality_status))

    def predict_quality(self, temperature: float, humidity: float) -> str:
        prediction = self.quality_model.predict([[temperature, humidity]])[0]
        return "Good" if prediction == 1 else "Poor"

    def get_supply_chain_data(self) -> pd.DataFrame:
        with sqlite3.connect(self.db_path) as conn:
            query = """
                SELECT d.name, s.transaction_date, s.quantity, s.transaction_type
                FROM supply_chain s
                JOIN drugs d ON s.drug_id = d.drug_id
                ORDER BY s.transaction_date DESC
            """
            return pd.read_sql_query(query, conn)

    def monitor_conditions(self) -> List[dict]:
        alerts = []
        for medicine in self.medicines:
            previous_status = medicine.quality_status
            current_status = medicine.assess_quality()
            
            if current_status != "Good" and current_status != previous_status:
                alerts.append({
                    'name': medicine.name,
                    'batch': medicine.batch_no,
                    'status': current_status,
                    'temperature': medicine.temperature,
                    'humidity': medicine.humidity,
                    'timestamp': datetime.now()
                })
                
            self._log_medicine_status(medicine)
        return alerts


if __name__ == "__main__":
    system = DrugMonitoringSystem()
    
    paracetamol = Medicine(
        name="Paracetamol",
        batch_no="B123",
        mfg_date=datetime.now() - timedelta(days=30),
        exp_date=datetime.now() + timedelta(days=365),
        chemical_composition="C8H9NO2",
        temperature=25.0,
        humidity=50.0
    )
    
    ibuprofen = Medicine(
        name="Ibuprofen",
        batch_no="B456",
        mfg_date=datetime.now() - timedelta(days=15),
        exp_date=datetime.now() + timedelta(days=730),
        chemical_composition="C13H18O2",
        temperature=32.0,
        humidity=75.0
    )
    
    system.add_medicine(paracetamol)
    system.add_medicine(ibuprofen)
    
    alerts = system.monitor_conditions()
    for alert in alerts:
        print(f"ALERT: {alert['name']} (Batch {alert['batch']}) is in {alert['status']} condition!")
    
    supply_data = system.get_supply_chain_data()
    if not supply_data.empty:
        print("\nRecent Supply Chain Activity:")
        print(supply_data.head()) 