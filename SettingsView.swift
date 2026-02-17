import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var firestoreService: FirestoreService
    @EnvironmentObject var authManager: AuthManager
    @State private var selectedSection: SettingsSection? = nil
    
    enum SettingsSection: Identifiable {
        case children, categories
        var id: Self { self }
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DS.spacingL) {
                    SettingsHeaderView(
                        children: firestoreService.children
                    )
                    
                    VStack(spacing: DS.spacingM) {
                        SettingsSectionCard(
                            icon: "person.2.fill",
                            title: "こどもの管理",
                            subtitle: "\(firestoreService.children.count)人登録済み",
                            color: Color(hex: "#74B9FF") ?? .blue
                        ) {
                            selectedSection = .children
                        }
                        
                        SettingsSectionCard(
                            icon: "tag.fill",
                            title: "カテゴリの管理",
                            subtitle: "\(firestoreService.categories.count)カテゴリ",
                            color: Color(hex: "#55EFC4") ?? .green
                        ) {
                            selectedSection = .categories
                        }
                        
                        StatsCard(
                            children: firestoreService.children,
                            items: firestoreService.items,
                            categories: firestoreService.categories
                        )
                        
                        Button {
                            authManager.signOut()
                        } label: {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                    .foregroundColor(DS.danger)
                                Text("サインアウト")
                                    .font(.rounded(15, weight: .medium))
                                    .foregroundColor(DS.danger)
                                Spacer()
                            }
                            .padding(DS.spacingM)
                            .cardStyle()
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, DS.spacingM)
                    
                    Text("こどもクローゼット v1.0.0")
                        .font(.rounded(12))
                        .foregroundColor(DS.secondaryText.opacity(0.5))
                    
                    Spacer(minLength: 100)
                }
                .padding(.top, DS.spacingM)
            }
            .background(DS.background.ignoresSafeArea())
            .navigationBarHidden(true)
            .navigationDestination(item: $selectedSection) { section in
                switch section {
                case .children:
                    ChildrenSettingsView()
                        .environmentObject(firestoreService)
                case .categories:
                    CategoriesSettingsView()
                        .environmentObject(firestoreService)
                }
            }
        }
    }
}

struct SettingsHeaderView: View {
    let children: [Child]
    
    var body: some View {
        VStack(spacing: DS.spacingM) {
            Text("⚙️")
                .font(.system(size: 48))
            
            Text("設定")
                .font(.rounded(28, weight: .bold))
                .foregroundColor(DS.primaryText)
            
            if !children.isEmpty {
                HStack(spacing: -12) {
                    ForEach(children) { child in
                        ZStack {
                            Circle()
                                .fill(child.color)
                                .frame(width: 44, height: 44)
                                .overlay(Circle().strokeBorder(.white, lineWidth: 2))
                            Text(child.emoji)
                                .font(.system(size: 22))
                        }
                    }
                }
            }
        }
        .padding(.top, DS.spacingM)
    }
}

struct SettingsSectionCard: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: DS.spacingM) {
                ZStack {
                    RoundedRectangle(cornerRadius: DS.radiusS)
                        .fill(color.opacity(0.15))
                        .frame(width: 44, height: 44)
                    Image(systemName: icon)
                        .font(.system(size: 20))
                        .foregroundColor(color)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.rounded(16, weight: .semibold))
                        .foregroundColor(DS.primaryText)
                    Text(subtitle)
                        .font(.rounded(13))
                        .foregroundColor(DS.secondaryText)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(DS.secondaryText.opacity(0.5))
            }
            .padding(DS.spacingM)
            .cardStyle()
        }
        .buttonStyle(.plain)
    }
}

struct StatsCard: View {
    let children: [Child]
    let items: [WardrobeItem]
    let categories: [ItemCategory]
    
    var totalQuantity: Int { items.reduce(0) { $0 + $1.quantity } }
    
    var body: some View {
        VStack(alignment: .leading, spacing: DS.spacingM) {
            Text("📊 現在の統計")
                .font(.rounded(15, weight: .semibold))
                .foregroundColor(DS.primaryText)
            
            HStack(spacing: DS.spacingM) {
                MiniStat(value: "\(children.count)", label: "こども", color: Color(hex: "#FF8FAB") ?? .pink)
                MiniStat(value: "\(items.count)", label: "アイテム種", color: DS.accent)
                MiniStat(value: "\(totalQuantity)", label: "総アイテム数", color: Color(hex: "#55EFC4") ?? .green)
            }
        }
        .padding(DS.spacingM)
        .cardStyle()
    }
}

struct MiniStat: View {
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.rounded(22, weight: .bold))
                .foregroundColor(color)
            Text(label)
                .font(.rounded(11))
                .foregroundColor(DS.secondaryText)
        }
        .frame(maxWidth: .infinity)
    }
}

struct ChildrenSettingsView: View {
    @EnvironmentObject var firestoreService: FirestoreService
    @Environment(\.dismiss) var dismiss
    @State private var children: [Child] = []
    @State private var showAddChild = false
    @State private var editingChild: Child?
    @State private var isReordering = false
    
    var body: some View {
        List {
            Section {
                ForEach($children) { $child in
                    ChildRow(child: $child) {
                        editingChild = child
                    }
                }
                .onMove { indices, destination in
                    children.move(fromOffsets: indices, toOffset: destination)
                    Task { try? await firestoreService.updateChildrenOrder(children) }
                }
                .onDelete { indices in
                    Task {
                        for index in indices {
                            try? await firestoreService.deleteChild(children[index])
                        }
                    }
                }
            } header: {
                Text("こどものプロフィール")
            } footer: {
                Text("≡ をドラッグして並び替えできます")
            }
            
            Section {
                Button {
                    showAddChild = true
                } label: {
                    Label("こどもを追加", systemImage: "plus.circle.fill")
                        .font(.rounded(15, weight: .medium))
                        .foregroundColor(DS.accent)
                }
            }
        }
        .navigationTitle("こどもの管理")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            EditButton()
        }
        .onAppear { children = firestoreService.children }
        .onChange(of: firestoreService.children) { _, new in children = new }
        .sheet(isPresented: $showAddChild) {
            ChildEditorView(mode: .add)
                .environmentObject(firestoreService)
        }
        .sheet(item: $editingChild) { child in
            ChildEditorView(mode: .edit(child))
                .environmentObject(firestoreService)
        }
    }
}

struct ChildRow: View {
    @Binding var child: Child
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: DS.spacingM) {
                ZStack {
                    Circle()
                        .fill(child.color)
                        .frame(width: 44, height: 44)
                    Text(child.emoji)
                        .font(.system(size: 22))
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(child.name)
                        .font(.rounded(16, weight: .semibold))
                        .foregroundColor(DS.primaryText)
                    
                    Circle()
                        .fill(child.color)
                        .frame(width: 16, height: 16)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(DS.secondaryText.opacity(0.5))
            }
        }
        .buttonStyle(.plain)
    }
}
