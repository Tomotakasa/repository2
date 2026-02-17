import SwiftUI
import Firebase

@main
struct KodomoWardrobeApp: App {
    
    @StateObject private var authManager = AuthManager()
    @StateObject private var appState = AppState()
    
    init() {
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(appState)
        }
    }
}
