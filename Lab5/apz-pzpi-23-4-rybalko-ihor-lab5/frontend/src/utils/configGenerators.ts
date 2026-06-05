export interface ScalingParams {
  backendReplicas: number;
  cpuLimit: number; // in cores, e.g. 0.5, 1, 2
  memoryLimit: number; // in MB, e.g. 512, 1024
  hpaEnabled: boolean;
  hpaMinReplicas: number;
  hpaMaxReplicas: number;
  hpaTargetCpu: number;
  dbConnectionPool: number;
  dbReplicas: number;
  dbStorage: number; // in GB
  endpoints: string[];
}

export const generateDockerCompose = (params: ScalingParams): string => {
  return `version: '3.8'

services:
  # Load Balancer to distribute traffic between scaled API replicas
  nginx-lb:
    image: nginx:alpine
    container_name: foodpreorder-lb
    ports:
      - "5082:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api
    restart: always

  # Scaled Backend Application
  api:
    image: foodpreorder-api:latest
    build:
      context: ../../../../Test2/FoodPreOrder
      dockerfile: Dockerfile
    deploy:
      replicas: ${params.backendReplicas}
      resources:
        limits:
          cpus: '${params.cpuLimit}'
          memory: ${params.memoryLimit}M
        reservations:
          cpus: '${Math.max(0.1, +(params.cpuLimit * 0.25).toFixed(2))}'
          memory: ${Math.max(64, Math.floor(params.memoryLimit * 0.25))}M
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ASPNETCORE_URLS=http://+:80
      - ConnectionStrings__DefaultConnection=Server=db,1433;Database=FoodPreOrderDB;User Id=sa;Password=YourStrong@Pass123;TrustServerCertificate=True;MultipleActiveResultSets=true;Max Pool Size=${params.dbConnectionPool}
      - Jwt__Key=G2453bhsdfkYGhasdr5asjjiksdfni12babsdjiajkkaloksdluwkasnhh6126bd
    depends_on:
      - db
    restart: always

  # Database Engine (MS SQL Server)
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: foodpreorder-db
    ports:
      - "1433:1433"
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=YourStrong@Pass123
    volumes:
      - mssql-data:/var/opt/mssql
    restart: always

volumes:
  mssql-data:
    driver: local
`;
};

export const generateNginxConf = (params: ScalingParams): string => {
  return `# Nginx Load Balancer Configuration for FoodPreOrder
# Configured for ${params.backendReplicas} backend replicas and db pool of ${params.dbConnectionPool}
user nginx;
worker_processes auto;

events {
    worker_connections 2048;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    upstream api_servers {
        # Docker Compose automatically resolves this service name to internal replica IPs
        server api:80;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://api_servers;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Connection pooling tuning
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            
            # Timeouts
            proxy_connect_timeout 10s;
            proxy_read_timeout 60s;
            proxy_send_timeout 60s;
        }
    }
}
`;
};

export const generateKubernetes = (params: ScalingParams): string => {
  const hpaYaml = params.hpaEnabled
    ? `
---
# Horizontal Pod Autoscaler for Backend API
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: foodpreorder-api-hpa
  namespace: default
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: foodpreorder-api
  minReplicas: ${params.hpaMinReplicas}
  maxReplicas: ${params.hpaMaxReplicas}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: ${params.hpaTargetCpu}
`
    : '';

  return `apiVersion: v1
kind: ConfigMap
metadata:
  name: foodpreorder-config
  namespace: default
data:
  ConnectionStrings__DefaultConnection: "Server=foodpreorder-db-service,1433;Database=FoodPreOrderDB;User Id=sa;Password=YourStrong@Pass123;TrustServerCertificate=True;MultipleActiveResultSets=true;Max Pool Size=${params.dbConnectionPool}"
  Jwt__Key: "G2453bhsdfkYGhasdr5asjjiksdfni12babsdjiajkkaloksdluwkasnhh6126bd"
  ASPNETCORE_HTTP_PORTS: "80"
  ASPNETCORE_ENVIRONMENT: "Production"

---
# Persistent Volume Claim for MS SQL Server
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mssql-pvc
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: ${params.dbStorage}Gi

---
# Deployment for MS SQL Server Database
apiVersion: apps/v1
kind: Deployment
metadata:
  name: foodpreorder-db
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: foodpreorder-db
  template:
    metadata:
      labels:
        app: foodpreorder-db
    spec:
      containers:
      - name: mssql
        image: mcr.microsoft.com/mssql/server:2022-latest
        ports:
        - containerPort: 1433
        env:
        - name: ACCEPT_EULA
          value: "Y"
        - name: MSSQL_SA_PASSWORD
          value: "YourStrong@Pass123"
        resources:
          limits:
            cpu: "2.0"
            memory: 4Gi
          requests:
            cpu: "0.5"
            memory: 2Gi
        volumeMounts:
        - name: mssql-storage
          mountPath: /var/opt/mssql
      volumes:
      - name: mssql-storage
        emptyDir: {}

---
# Service for Database access
apiVersion: v1
kind: Service
metadata:
  name: foodpreorder-db-service
  namespace: default
spec:
  ports:
  - port: 1433
    targetPort: 1433
    nodePort: 31433
  selector:
    app: foodpreorder-db
  type: NodePort

---
# Deployment for API Backend Servers
apiVersion: apps/v1
kind: Deployment
metadata:
  name: foodpreorder-api
  namespace: default
spec:
  replicas: ${params.hpaEnabled ? params.hpaMinReplicas : params.backendReplicas}
  selector:
    matchLabels:
      app: foodpreorder-api
  template:
    metadata:
      labels:
        app: foodpreorder-api
    spec:
      containers:
      - name: api
        image: foodpreorder-api:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
        envFrom:
        - configMapRef:
            name: foodpreorder-config
        resources:
          limits:
            cpu: "${params.cpuLimit}"
            memory: "${params.memoryLimit}Mi"
          requests:
            cpu: "${Math.max(0.1, +(params.cpuLimit * 0.25).toFixed(2))}"
            memory: "${Math.max(64, Math.floor(params.memoryLimit * 0.25))}Mi"
        livenessProbe:
          tcpSocket:
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 10
        readinessProbe:
          tcpSocket:
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 5

---
# Service to Load-Balance traffic across Pods
apiVersion: v1
kind: Service
metadata:
  name: foodpreorder-api-service
  namespace: default
spec:
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30082
  selector:
    app: foodpreorder-api
  type: NodePort
${hpaYaml}`;
};

export const generateLocustFile = (params: ScalingParams): string => {
  const taskDefinitions = params.endpoints.map((ep, idx) => {
    let taskName = ep.replace(/\/api\//, '').replace(/\//g, '_');
    let requestLine = '';

    if (ep === '/api/auth/login') {
      requestLine = `self.client.post("${ep}", json={"email": "admin@foodpreorder.com", "password": "Password123"}, name="${ep}")`;
    } else {
      requestLine = `self.client.get("${ep}", name="${ep}")`;
    }

    return `    @task(${10 - idx > 1 ? 10 - idx : 1})
    def test_${taskName}(self):
        with self.client.rename_request("${ep}"):
            response = ${requestLine}
            if response.status_code != 200:
                response.failure(f"Got status {response.status_code}")
`;
  }).join('\n');

  return `import random
from locust import HttpUser, task, between, events

class FoodPreOrderLoadTester(HttpUser):
    # Simulates simulated user delay ("think time") in seconds
    wait_time = between(1.0, 3.0)

${taskDefinitions}

# To run this locust test locally:
# 1. Install Locust: pip install locust
# 2. Run Locust command: locust -f locustfile.py
# 3. Open browser at http://localhost:8089
# 4. Set Host (e.g. http://localhost:30082 for K8s or http://localhost:5082 for Docker), Users, and Spawn Rate in the Locust Web UI.
`;
};
