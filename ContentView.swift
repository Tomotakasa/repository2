import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Group {
            if authManager.isSignedIn, let familyId = authManager.familyId {
                MainTabView(familyId: familyId)
            } else {
                OnboardingView()
            }
        }
        .animation(.easeInOut, value: authManager.isSignedIn)
    }
}

struct MainTabView: View {
    let familyId: String
    @EnvironmentObject var appState: AppState
    @StateObject var firestoreService: FirestoreService
    
    init(familyId: String) {
        self.familyId = familyId
        self._firestoreService = StateObject(wrappedValue: FirestoreService(familyId: familyId))
    }
    
    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $appState.selectedTab) {
                HomeView()
                    .tag(TabItem.home)
                
                InventoryView()
                    .tag(TabItem.inventory)
                
                SettingsView()
                    .tag(TabItem.settings)
            }
            .environmentObject(firestoreService)
            
            CustomTabBar(selectedTab: $appState.selectedTab) {
                appState.showingAddItem = true
            }
        }
        .sheet(isPresented: $appState.showingAddItem) {
            AddItemView()
                .environmentObject(firestoreService)
        }
    }
}

struct CustomTabBar: View {
    @Binding var selectedTab: TabItem
    let onAddTap: () -> Void
    
    var body: some View {
        HStack(spacing: 0) {
            TabBarButton(item: .home, selectedTab: $selectedTab)
            TabBarButton(item: .inventory, selectedTab: $selectedTab)
            
            Button(action: {
                HapticFeedback.medium()
                onAddTap()
            }) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [DS.accent, DS.accentLight],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 58, height: 58)
                        .shadow(color: DS.accent.opacity(0.4), radius: 12, x: 0, y: 4)
                    
                    Image(systemName: "plus")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.white)
                }
            }
            .offset(y: -14)
            
            TabBarButton(item: .inventory, selectedTab: $selectedTab)
                .opacity(0)
            TabBarButton(item: .settings, selectedTab: $selectedTab)
        }
        .padding(.horizontal, DS.spacingM)
        .padding(.top, 12)
        .padding(.bottom, 8)
        .background(
            RoundedRectangle(cornerRadius: 28)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 20, x: 0, y: -4)
        )
        .padding(.horizontal, DS.spacingM)
        .padding(.bottom, 4)
    }
}

struct TabBarButton: View {
    let item: TabItem
    @Binding var selectedTab: TabItem
    
    var isSelected: Bool { selectedTab == item }
    
    var body: some View {
        Button {
            HapticFeedback.light()
            withAnimation(.spring(response: 0.3)) {
                selectedTab = item
            }
        } label: {
            VStack(spacing: 4) {
                Image(systemName: item.icon)
                    .font(.system(size: 20, weight: isSelected ? .bold : .regular))
                    .foregroundColor(isSelected ? DS.accent : DS.secondaryText)
                    .scaleEffect(isSelected ? 1.15 : 1.0)
                
                Text(item.title)
                    .font(.rounded(10, weight: isSelected ? .semibold : .regular))
                    .foregroundColor(isSelected ? DS.accent : DS.secondaryText)
            }
            .frame(maxWidth: .infinity)
            .animation(.spring(response: 0.3), value: isSelected)
        }
        .buttonStyle(.plain)
    }
}
