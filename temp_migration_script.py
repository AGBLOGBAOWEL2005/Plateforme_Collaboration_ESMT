import os
import subprocess

venv_python = os.path.abspath(".\\venv\\Scripts\\python.exe")
manage_py = os.path.abspath("manage.py")

subprocess.run([venv_python, manage_py, "makemigrations", "communication"])
subprocess.run([venv_python, manage_py, "migrate"])