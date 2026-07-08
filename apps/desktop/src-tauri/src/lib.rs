pub mod commands {
    use tauri;

    #[tauri::command]
    pub fn greet(name: &str) -> String {
        format!("Hello, {}! Welcome to Image Gallery.", name)
    }
}
