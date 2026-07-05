import subprocess
import os
import sys
import time
import signal

# Force UTF-8 output for terminals with Arabic/legacy code pages (cp1256, etc.)
sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Store processes for cleanup
processes = []

def signal_handler(sig, frame):
    """Handle Ctrl+C to stop all processes"""
    print("\n\n⚠️  Stopping all servers...")
    for proc in processes:
        if proc.poll() is None:  # If process is still running
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
    print("✅ All services stopped.")
    sys.exit(0)

def check_env_file():
    """Check if .env file exists in backend folder"""
    env_path = os.path.join("backend", ".env")
    if not os.path.exists(env_path):
        print("❌ .env file not found in backend folder.")
        print("Please run setup-windows.ps1 first or create the .env file manually.")
        sys.exit(1)
    print("✅ .env file found.")

def wait_for_backend(max_retries=30):
    """Wait for backend to be ready on port 3001"""
    import socket

    start = time.time()
    print("⏳ Waiting for backend to be ready...", end="", flush=True)

    for i in range(max_retries):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', 3001))
            sock.close()
            if result == 0:
                elapsed = time.time() - start
                print(f" ✅ ({elapsed:.0f}s)")
                return True
        except:
            pass

        time.sleep(1)

    elapsed = time.time() - start
    print(f"\n❌ Backend not ready after {elapsed:.0f}s.")
    return False

def get_network_ip():
    """Detect local network IP address"""
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return 'localhost'


def start_docker_db():
    """Start PostgreSQL Docker container if not running"""
    print("🐘 Checking PostgreSQL Docker container...")
    result = subprocess.run(
        ["docker", "inspect", "-f", "{{.State.Running}}", "backend-postgres-1"],
        capture_output=True, text=True,
    )
    if result.returncode == 0 and result.stdout.strip() == "true":
        print("✅ PostgreSQL container already running.")
        return
    if result.returncode == 0 and result.stdout.strip() == "false":
        print("🔄 Starting PostgreSQL container (exited)...")
    else:
        print("🔄 Starting PostgreSQL container...")

    result = subprocess.run(
        ["docker", "start", "backend-postgres-1"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print("❌ Failed to start PostgreSQL. Make sure Docker is running.")
        print(result.stderr)
        sys.exit(1)

    # Wait for PostgreSQL to accept connections
    import socket
    for i in range(15):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        if sock.connect_ex(('localhost', 5432)) == 0:
            sock.close()
            print("✅ PostgreSQL container started and accepting connections.")
            return
        sock.close()
        time.sleep(1)

    print("❌ PostgreSQL container started but not accepting connections after 15s.")
    sys.exit(1)


def build_backend_if_needed():
    """Build the backend only if dist doesn't exist"""
    backend_dir = os.path.join(SCRIPT_DIR, "backend")
    dist_main = os.path.join(backend_dir, "dist", "main.js")

    if os.path.exists(dist_main):
        print("✅ Backend already built, skipping compilation.")
        return

    print("🔨 Building Backend (first time, may take ~60s)...")
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=backend_dir,
        shell=True,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print("❌ Backend build failed.")
        print(result.stderr)
        sys.exit(1)
    print("✅ Backend built successfully.")


def start_backend():
    """Start the backend server (pre-built, no compilation)"""
    print("🔧 Starting Backend Server (Port 3001)...")
    backend_dir = os.path.join(SCRIPT_DIR, "backend")

    network_ip = get_network_ip()

    # Use Popen to run in background
    # Use production mode to suppress dev-only features (logging controlled by DATABASE_LOGGING in .env)
    env = {**os.environ, "NODE_ENV": "production"}
    env["NODE_NO_WARNINGS"] = "1"
    # Set FRONTEND_DOMAIN to accept both local and network origins
    env["FRONTEND_DOMAIN"] = f"http://localhost:3000,http://{network_ip}:3000"


    proc = subprocess.Popen(
        ["npm", "run", "start:prod"],
        cwd=backend_dir,
        shell=True,
        env=env,
    )

    processes.append(proc)
    return proc


def start_frontend():
    """Start the frontend server"""
    print("🎨 Starting Frontend Server (Port 3000)...")
    frontend_dir = os.path.join(SCRIPT_DIR, "frontend")

    # Bind to all network interfaces so other PCs can access
    network_ip = get_network_ip()
    env = {**os.environ, "HOSTNAME": "0.0.0.0", "ALLOWED_DEV_ORIGINS": f"localhost,{network_ip}", "NODE_OPTIONS": "--max-old-space-size=2048"}

    # Use Popen to run in background
    proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=True,
        env=env,
    )
    processes.append(proc)
    return proc

def check_chatbot_deps():
    """Check if chatbot Python dependencies are installed"""
    chatbot_dir = os.path.join(SCRIPT_DIR, "chatbot")
    req_file = os.path.join(chatbot_dir, "requirements.txt")
    if not os.path.exists(req_file):
        return False
    try:
        import spacy
        return True
    except ImportError:
        return False


def install_chatbot_deps():
    """Install chatbot Python dependencies"""
    chatbot_dir = os.path.join(SCRIPT_DIR, "chatbot")
    print("🔧 Installing chatbot dependencies (first time only)...")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
        cwd=chatbot_dir,
    )
    if result.returncode != 0:
        print("⚠️ Chatbot pip install had issues. You can run manually: cd chatbot && pip install -r requirements.txt")


def run_chatbot_migrations():
    """Run chatbot DB migrations"""
    chatbot_dir = os.path.join(SCRIPT_DIR, "chatbot")
    subprocess.run(
        [sys.executable, "-m", "database.migrations"],
        cwd=chatbot_dir,
        capture_output=True,
        text=True,
    )


def start_chatbot():
    """Start the AI chatbot server"""
    print("🤖 Starting AI Chatbot (Port 8765)...")
    chatbot_dir = os.path.join(SCRIPT_DIR, "chatbot")

    env = os.environ.copy()
    env.pop("PYTHONPATH", None)
    env.pop("PYTHONHOME", None)

    main_py = os.path.join(chatbot_dir, "main.py")
    proc = subprocess.Popen(
        [sys.executable, "-u", main_py],
        cwd=chatbot_dir,
        env=env,
    )
    processes.append(proc)
    return proc


def main():
    print("🚀 Starting ELMostafa Factory Management System...")
    print()
    
    # Register Ctrl+C handler
    signal.signal(signal.SIGINT, signal_handler)
    
    # Check for .env file
    check_env_file()
    print()

    # Start PostgreSQL Docker container
    start_docker_db()
    print()

    # Kill any existing processes on ports 3000, 3001, and 8765
    print("🔄 Stopping existing servers...")
    subprocess.run(
        'powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { taskkill /F /PID $_ }"',
        shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    subprocess.run(
        'powershell -Command "Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { taskkill /F /PID $_ }"',
        shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    subprocess.run(
        'powershell -Command "Get-NetTCPConnection -LocalPort 8765 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { taskkill /F /PID $_ }"',
        shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    time.sleep(1)
    
    # Build backend only if first time
    build_backend_if_needed()
    print()
    
    # Start Backend
    backend_proc = start_backend()
    print()
    
    # Wait for backend to be ready
    if not wait_for_backend():
        signal_handler(None, None)
        return
    
    # Start Frontend
    print()
    frontend_proc = start_frontend()
    print()
    
    # Start AI Chatbot
    if not check_chatbot_deps():
        install_chatbot_deps()
    run_chatbot_migrations()
    chatbot_proc = start_chatbot()
    print()
    
    # Print success message
    print()
    print("✅ Servers Started Successfully!")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("📱 Local:     http://localhost:3000")
    network_ip = get_network_ip()
    if network_ip != 'localhost':
        print(f"🌐 Network:   http://{network_ip}:3000")
    print("🔌 Backend:  http://localhost:3001")
    print("🤖 Chatbot:  http://localhost:8765")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print()
    print("👤 Login Credentials:")
    print("   Username: admin@admin.com")
    print("   Password: admin123")
    print("   Username: newadmin@example.com")
    print("   Password: newadmin123")
    print()
    if network_ip != 'localhost':
        print(f"🌐 From another PC on your network, open: http://{network_ip}:3000")
    print("⚠️  Make sure your firewall allows inbound ports 3000, 3001, and 8765")
    print()
    print("⚠️  Press Ctrl+C to stop all servers")
    print()
    
    # Wait for processes to complete (or Ctrl+C)
    try:
        while True:
            time.sleep(1)
            # Check if processes are still running
            if backend_proc.poll() is not None:
                print("❌ Backend process exited unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("❌ Frontend process exited unexpectedly.")
                break
            if chatbot_proc.poll() is not None:
                print("❌ Chatbot process exited unexpectedly.")
                break
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()