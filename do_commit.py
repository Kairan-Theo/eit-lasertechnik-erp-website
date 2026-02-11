import subprocess
import sys

def run():
    try:
        # Stage all changes
        print("Staging all changes...")
        subprocess.check_call(['git', 'add', '.'])
        
        # Commit with the specified message
        print("Committing changes...")
        message = "tex invoice sectioin"
        subprocess.check_call(['git', 'commit', '-m', message])
        
        print("Successfully committed.")
    except subprocess.CalledProcessError as e:
        print(f"Error during git operation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run()
