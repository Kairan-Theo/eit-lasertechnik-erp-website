import subprocess
import os

def run_git_command(command):
    try:
        result = subprocess.run(['git'] + command, capture_output=True, text=True, check=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return f"Error: {e.stderr}\nOutput: {e.stdout}"

if __name__ == "__main__":
    with open('git_info.txt', 'w', encoding='utf-8') as f:
        f.write("--- Git Status ---\n")
        f.write(run_git_command(['status', '-s']))
        f.write("\n\n--- Current Branch ---\n")
        f.write(run_git_command(['rev-parse', '--abbrev-ref', 'HEAD']))
        f.write("\n\n--- Diff (Unstaged) ---\n")
        f.write(run_git_command(['diff', '--name-only']))
        f.write("\n\n--- Diff (Staged) ---\n")
        f.write(run_git_command(['diff', '--cached', '--name-only']))
