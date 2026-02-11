import subprocess
import os

def run_git_command(command):
    try:
        result = subprocess.run(['git'] + command, capture_output=True, text=True, check=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return f"Error: {e.stderr}"

if __name__ == "__main__":
    print("--- Git Status ---")
    print(run_git_command(['status', '-s']))
    
    print("\n--- Staging and Committing ---")
    print(run_git_command(['add', '.']))
    print(run_git_command(['commit', '-m', 'tex invoice sectioin']))
