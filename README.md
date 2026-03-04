# Student Attendance System

**Version 2.0.0** | Multi-Tenant | Production Ready

A comprehensive student attendance management system built with Angular and JSON Server, featuring complete data isolation between instructors and role-based access control.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start servers (Windows)
start-dev.bat

# OR Manual start
npm run json-server  # Terminal 1
npm start            # Terminal 2
```

**Access**: http://localhost:4200  
**Login**: admin@school.com / admin123

---

## 📚 Documentation

### 4-Part Documentation Series

**[📑 Documentation Index](DOCUMENTATION-INDEX.md)** - Start here for navigation

1. **[Part 1 - Quick Start & Overview](DOCUMENTATION-PART-1.md)**
   - Installation commands
   - System overview
   - Multi-tenancy architecture
   - Key features

2. **[Part 2 - Installation & User Guides](DOCUMENTATION-PART-2.md)**
   - Step-by-step installation
   - Admin user guide
   - Instructor user guide
   - Student & parent guides
   - Features deep dive

3. **[Part 3 - Architecture & Implementation](DOCUMENTATION-PART-3.md)**
   - Technology stack
   - Project structure
   - Data models & API endpoints
   - Component architecture
   - Multi-tenant implementation
   - Security architecture

4. **[Part 4 - Testing, API & Troubleshooting](DOCUMENTATION-PART-4.md)**
   - Testing checklist
   - API testing guide
   - Troubleshooting guide
   - Common issues & solutions
   - Performance optimization
   - Changelog & future enhancements

**[Complete Single-File Documentation](DOCUMENTATION.md)** - All content in one file

---

## ✨ Key Features

- ✅ **Multi-Tenant Architecture** - Complete data isolation per instructor
- ✅ **Role-Based Access** - Admin, Instructor, Student, Parent roles
- ✅ **Account Management** - Create, edit, delete accounts with cascading deletes
- ✅ **Department Management** - Organize instructors by department
- ✅ **Attendance System** - Take attendance with privacy controls
- ✅ **Revolutionary UI** - Modern gradient designs with smooth animations
- ✅ **SweetAlert2** - Beautiful notifications throughout
- ✅ **Persistent Storage** - JSON Server with REST API
- ✅ **Secure Authentication** - Password validation and session management
- ✅ **Real-Time Updates** - Angular signals for reactive state

---

## 🎯 System Workflow

1. **Admin** creates instructor accounts and manages departments
2. **Instructor** creates subjects and student accounts (isolated data)
3. **Students** view their subjects and attendance records
4. **Parents** monitor child's attendance (read-only)

---

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.com | admin123 |
| Instructor | (created by admin) | instructor123 |
| Student | (created by instructor) | student123 |
| Parent | (created with student) | parent123 |

**⚠️ Change default passwords after first login**

---

## 🛠️ Technology Stack

- **Frontend**: Angular 21, Tailwind CSS, Lucide Icons
- **Backend**: JSON Server (REST API)
- **Database**: db.json (JSON file storage)
- **State Management**: Angular Signals
- **Notifications**: SweetAlert2
- **Language**: TypeScript

---

## 📁 Project Structure

```
student-attendance-system/
├── db.json                      # Database
├── start-dev.bat               # Windows startup script
├── DOCUMENTATION.md            # Complete documentation
├── README.md                   # This file
├── src/app/
│   ├── components/             # Reusable components
│   ├── pages/                  # Page components
│   ├── services/               # Business logic
│   ├── models/                 # Data models
│   └── guards/                 # Route guards
└── package.json                # Dependencies
```

---

## 🎨 UI Features

### Revolutionary Design
- Gradient headers with floating animations
- Modern card designs with hover effects
- Smooth transitions and animations
- Enhanced buttons with ripple effects
- Beautiful modals with backdrop blur
- Responsive mobile-friendly layouts
- Consistent purple/indigo color scheme

### User Experience
- SweetAlert2 for all notifications
- Auto-closing success messages
- Confirmation dialogs for destructive actions
- Loading states and feedback
- Intuitive navigation
- Touch-optimized for mobile

---

## 🔒 Security Features

- Password-based authentication
- Role-based route guards
- Permission-based UI elements
- Student privacy protection (see only own data)
- Data isolation per instructor
- Session management
- Cascading delete protection

---

## 📊 Multi-Tenant Architecture

```
Admin (System-Wide Access)
 ├── Instructor A (Isolated)
 │   ├── Subjects: Math, Science
 │   ├── Students: Alice, Bob, Charlie
 │   └── Attendance Records
 │
 └── Instructor B (Isolated)
     ├── Subjects: English, History
     ├── Students: David, Eve, Frank
     └── Attendance Records
```

Each instructor's data is completely private and isolated.

---

## 🆘 Need Help?

**[Start with the Documentation Index](DOCUMENTATION-INDEX.md)** to find:
- Quick start guides
- Role-specific user guides
- Architecture and implementation details
- Testing and troubleshooting
- API reference
- Common issues and solutions

Or jump directly to:
- **New users**: [Part 1 - Quick Start](DOCUMENTATION-PART-1.md)
- **Installation**: [Part 2 - Installation Guide](DOCUMENTATION-PART-2.md)
- **Developers**: [Part 3 - Architecture](DOCUMENTATION-PART-3.md)
- **Troubleshooting**: [Part 4 - Troubleshooting](DOCUMENTATION-PART-4.md)

---

## 📝 Recent Updates (v2.0.0)

- ✅ Removed demo accounts, single master admin
- ✅ Multi-tenant architecture with data isolation
- ✅ Account management with edit/delete
- ✅ Department management system
- ✅ Name fields (First, Middle, Last)
- ✅ Revolutionary UI/UX design
- ✅ SweetAlert2 integration
- ✅ Student privacy controls
- ✅ Cascading delete functionality

---

## 📄 License

Educational purposes. Free to use and modify.

---

**Built with ❤️ using Angular and JSON Server**
