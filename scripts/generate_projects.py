import os
import json

def generate_projects_data():
    base_path = "posts/assets"
    output_file = "js/projects_data.js"
    
    projects = []
    
    if os.path.exists(base_path):
        # List directories in posts/assets
        dirs = [d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d))]
        
        for d in dirs:
            folder_path = os.path.join(base_path, d)
            info_path = os.path.join(folder_path, "info.json")
            
            if os.path.exists(info_path):
                try:
                    with open(info_path, "r", encoding="utf-8") as f:
                        info = json.load(f)
                        
                        # Check visibility
                        # Default is True. Handle both boolean false and string "false"
                        visible = info.get("visible", True)
                        is_visible = True
                        if visible is False or str(visible).lower() == "false":
                            is_visible = False
                        
                        # Store normalized boolean visibility
                        info["visible"] = is_visible

                        # Add ID based on folder name if not present
                        info["id"] = d
                        # Check if has wiki (README.md)
                        if os.path.exists(os.path.join(folder_path, "README.md")):
                            info["has_wiki"] = True
                        else:
                            info["has_wiki"] = False
                        
                        projects.append(info)
                except Exception as e:
                    print(f"Error reading {info_path}: {e}")

    # Write to JS file
    js_content = f"window.PROJECTS_DATA = {json.dumps(projects, ensure_ascii=False, indent=2)};"
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    print(f"Successfully generated {output_file} with {len(projects)} projects.")

if __name__ == "__main__":
    generate_projects_data()
