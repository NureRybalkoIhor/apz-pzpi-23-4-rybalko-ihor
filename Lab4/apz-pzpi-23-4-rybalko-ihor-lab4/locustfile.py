import random
from locust import HttpUser, task, between, events

class FoodPreOrderLoadTester(HttpUser):
    # Simulates simulated user delay ("think time") in seconds
    wait_time = between(1.0, 3.0)

    @task(10)
    def test_restaurants(self):
        with self.client.rename_request("/api/restaurants"):
            response = self.client.get("/api/restaurants", name="/api/restaurants")
            if response.status_code != 200:
                response.failure(f"Got status {response.status_code}")

    @task(9)
    def test_dishes(self):
        with self.client.rename_request("/api/dishes"):
            response = self.client.get("/api/dishes", name="/api/dishes")
            if response.status_code != 200:
                response.failure(f"Got status {response.status_code}")

    @task(8)
    def test_auth_login(self):
        with self.client.rename_request("/api/auth/login"):
            response = self.client.post("/api/auth/login", json={"email": "admin@foodpreorder.com", "password": "Password123"}, name="/api/auth/login")
            if response.status_code != 200:
                response.failure(f"Got status {response.status_code}")


# To run this locust test locally:
# 1. Install Locust: pip install locust
# 2. Run Locust command: locust -f locustfile.py
# 3. Open browser at http://localhost:8089 and set Host to http://localhost:5082
# 4. Set Users = 1060, Spawn Rate = 23
