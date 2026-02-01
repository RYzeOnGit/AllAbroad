# AllAbroad Testing Guide

Complete feature list and testing instructions for all implemented functionality.

## 🔐 Authentication

### Admin Login
**Endpoint:** `POST /api/auth/login`  
**Frontend:** `http://localhost:3001/admin/login` → "Sign in as staff"

**Test Credentials:**
- Email: `admin@allabroad.com` (or your admin email from `.env`)
- Password: `AdminPassword123!` (or your admin password from `.env`)

**How to Test:**
1. Go to `/admin/login`
2. Select "Sign in as staff" tab
3. Enter admin credentials
4. Should redirect to `/admin/dashboard`

---

### Staff/User Login
**Endpoint:** `POST /api/auth/login`  
**Frontend:** `http://localhost:3001/admin/login` → "Sign in as staff"

**Test Credentials:**
- Create a staff account via signup flow (requires admin approval)
- Or use an existing approved user account

**How to Test:**
1. Go to `/admin/login`
2. Select "Sign in as staff" tab
3. Enter staff credentials
4. Should redirect to `/admin/dashboard`

---

### Student Login
**Endpoint:** `POST /api/auth/login`  
**Frontend:** `http://localhost:3001/admin/login` → "Sign in as student"

**Test Credentials:**
- Email: `ryan.chattopadhyay@student.allabroad.com`
- Password: `Student123!`

**How to Test:**
1. Go to `/admin/login`
2. Select "Sign in as student" tab
3. Enter student credentials
4. Should redirect to `/student/dashboard`

---

## 👨‍💼 Admin Dashboard Features

### 1. Leads Table
**Route:** `/admin/dashboard` (default)  
**Endpoint:** `GET /api/v1/leads`

**Features:**
- Paginated table of all leads
- Search by name, phone, country, target country, degree, subject, source
- Status filtering (new, contacted, qualified, etc.)
- Status update dropdown
- Badge showing count of new leads

**How to Test:**
1. Login as admin
2. Navigate to "Leads Table" in sidebar
3. Test pagination (if > 10 leads)
4. Use search bar to filter leads
5. Change lead status using dropdown
6. Verify badge shows new lead count

---

### 2. Kanban Board
**Route:** `/admin/dashboard/kanban`  
**Endpoint:** `GET /api/v1/leads`

**Features:**
- Drag-and-drop cards between status columns
- Search functionality
- Visual feedback during drag
- Automatic status updates
- Error handling with rollback

**How to Test:**
1. Login as admin
2. Navigate to "Kanban Board" in sidebar
3. Drag a lead card from one column to another
4. Verify card moves smoothly
5. Check backend updates status
6. Test search bar
7. Try dragging to invalid location (should return to original)

---

### 3. Statistics Dashboard
**Route:** `/admin/dashboard/stats`  
**Endpoint:** `GET /api/v1/leads/stats`

**Features:**
- Conversion rates by status
- Trend analysis (leads over time)
- Source performance metrics
- Country analytics (top source/target countries)
- Time-based metrics (average processing time)

**How to Test:**
1. Login as admin
2. Navigate to "Stats" in sidebar
3. View all statistics cards
4. Check conversion percentages
5. Review source performance table
6. Verify country analytics display correctly

---

### 4. User Management
**Route:** `/admin/dashboard/users`  
**Endpoint:** `GET /api/admin/users`, `POST /api/admin/users`, `PATCH /api/admin/users/{id}`, `DELETE /api/admin/users/{id}`

**Features:**
- View all staff users
- Create new users
- Edit user details
- Activate/deactivate users
- Delete users

**How to Test:**
1. Login as admin
2. Navigate to "Users" in sidebar
3. View list of users
4. Create a new user
5. Edit an existing user
6. Toggle user active status
7. Delete a user (if not last admin)

---

### 5. Pending Approvals
**Route:** `/admin/dashboard/approvals`  
**Endpoint:** `GET /api/admin/pending-users`, `POST /api/admin/pending-users/{id}/approve`, `POST /api/admin/pending-users/{id}/reject`

**Features:**
- View pending signup requests
- Approve or reject requests
- Badge showing pending count
- Real-time count updates

**How to Test:**
1. Sign up as a new staff member (creates pending request)
2. Login as admin
3. Navigate to "Approve Users" in sidebar
4. View pending requests
5. Approve a request (creates user account)
6. Reject a request (removes from pending)
7. Verify badge count decreases

---

### 6. Admin Profile
**Route:** `/admin/dashboard/profile`  
**Endpoint:** `GET /api/auth/me`, `PATCH /api/auth/me/password`, `DELETE /api/auth/me`

**Features:**
- View profile information
- Change password
- Delete account (blocks if last admin)

**How to Test:**
1. Login as admin
2. Navigate to "Profile" in sidebar
3. View profile details
4. Change password
5. Try to delete account (should work if not last admin)

---

## 🎓 Student Portal Features

### 1. Dashboard Overview
**Route:** `/student/dashboard` (default)  
**Endpoint:** `GET /api/student/dashboard`

**Features:**
- Progress bars for documents and applications
- Visa status display
- Payment alerts (pending/overdue)
- Unread message count
- Upcoming deadlines list
- Recent activity timeline

**How to Test:**
1. Login as student
2. View dashboard overview
3. Check progress percentages
4. Review upcoming deadlines
5. Check recent activity feed

---

### 2. Document Center
**Route:** `/student/dashboard/documents`  
**Endpoints:**
- `GET /api/student/documents` - List documents
- `POST /api/student/documents` - Upload document
- `GET /api/student/documents/{id}` - Get specific document
- `PATCH /api/student/documents/{id}` - Replace document
- `GET /api/student/documents/checklist` - Get required documents checklist

**Features:**
- Upload documents (PDF, DOCX)
- View all uploaded documents
- Required documents checklist
- Document status tracking (pending, approved, rejected, needs_revision)
- Counselor comments display
- Replace/update documents

**How to Test:**
1. Login as student
2. Navigate to "Documents" in sidebar
3. View required documents checklist
4. Upload a document:
   - Select document type (e.g., "passport")
   - Choose a file
   - Click "Upload"
5. View uploaded document in list
6. Check status (should be "pending")
7. Replace a document (upload new version)

---

### 3. Application Center
**Route:** `/student/dashboard/applications`  
**Endpoints:**
- `GET /api/student/applications` - List applications
- `POST /api/student/applications` - Create application
- `GET /api/student/applications/{id}` - Get specific application
- `PATCH /api/student/applications/{id}/submit` - Submit application

**Features:**
- Create new university applications
- Track application status (draft, submitted, under_review, accepted, rejected, waitlisted)
- View application deadlines
- AI suggestions display
- Counselor notes
- Submit applications

**How to Test:**
1. Login as student
2. Navigate to "Applications" in sidebar
3. Click "+ New Application"
4. Fill in form:
   - University Name: "University of Toronto"
   - Program Name: "Computer Science"
   - Country: "Canada"
   - Degree Level: "Master's"
   - Intake: "Fall 2024"
   - Application Deadline: (optional date)
5. Click "Create Application"
6. View application in list (status: "draft")
7. Click "Submit Application" button
8. Verify status changes to "submitted"

---

### 4. Visa Center
**Route:** `/student/dashboard/visa`  
**Endpoints:**
- `GET /api/student/visa` - Get visa application
- `POST /api/student/visa` - Create visa application
- `PATCH /api/student/visa/{id}` - Update visa application

**Features:**
- Create visa application
- Track visa status (not_started, documents_preparing, submitted, interview_scheduled, approved, rejected)
- Current stage tracking
- Interview date/location
- Processing timeline estimates
- Counselor notes

**How to Test:**
1. Login as student
2. Navigate to "Visa" in sidebar
3. Click "+ Start Visa Application"
4. Fill in form:
   - Country: "Canada"
   - Visa Type: "Student Visa"
   - Estimated Processing Days: "30"
5. Click "Create Visa Application"
6. View visa status and details
7. (Note: Status updates would typically come from counselor/admin)

---

### 5. Payments
**Route:** `/student/dashboard/payments`  
**Endpoints:**
- `GET /api/student/payments` - List payments/invoices
- `GET /api/student/payments/{id}` - Get specific payment

**Features:**
- View all invoices
- Payment status tracking (pending, paid, overdue, cancelled)
- Due date display
- Overdue highlighting
- Installment tracking
- Payment method display

**How to Test:**
1. Login as student
2. Navigate to "Payments" in sidebar
3. View list of payments/invoices
4. Check payment statuses
5. Verify overdue payments are highlighted
6. (Note: Payments are typically created by admin/counselor)

---

### 6. University Comparison Tool
**Route:** `/student/dashboard/compare`  
**Endpoint:** `GET /api/student/applications/compare?application_ids=1,2,3`

**Features:**
- Select 2-4 applications to compare
- Side-by-side comparison table
- Status comparison
- AI recommendation scores
- Highlights display

**How to Test:**
1. Login as student
2. Create at least 2 applications (see Application Center)
3. Navigate to "Compare" in sidebar
4. Select 2-4 applications using checkboxes
5. View comparison table
6. Compare university details, statuses, AI scores

---

### 7. Messaging
**Route:** `/student/dashboard/messages`  
**Endpoints:**
- `GET /api/student/messages` - List messages
- `POST /api/student/messages` - Send message
- `PATCH /api/student/messages/{id}/read` - Mark as read

**Features:**
- Chat interface
- Send messages to counselor/AI
- View message history
- Unread message indicators
- Real-time polling (updates every 5 seconds)
- Message timestamps

**How to Test:**
1. Login as student
2. Navigate to "Messages" in sidebar
3. Type a message in the textarea
4. Click "Send"
5. View message in chat (should appear on right side)
6. Check unread indicators
7. Click on unread messages to mark as read

---

### 8. Timeline
**Route:** `/student/dashboard/timeline`  
**Endpoint:** `GET /api/student/timeline?category=documents&limit=50`

**Features:**
- Chronological view of all activities
- Category filtering (documents, applications, visa, payments, communication)
- Event icons
- Timestamps
- Related entity links

**How to Test:**
1. Login as student
2. Perform some actions (upload document, create application, send message)
3. Navigate to "Timeline" in sidebar
4. View all events chronologically
5. Use category filter dropdown
6. Verify events show correct icons and timestamps

---

## 🌐 Public Features

### 1. Lead Submission Form
**Route:** `/apply`  
**Endpoint:** `POST /api/leads`

**Features:**
- Multi-step form
- Input validation
- Phone number normalization
- Spam detection
- Duplicate prevention
- Clean JSON responses

**How to Test:**
1. Go to `http://localhost:3001/apply`
2. Fill in the form:
   - Name: "Test Student"
   - Phone: "+1234567890"
   - Country: "India"
   - Target Country: "Canada"
   - Intake: "Fall 2024"
   - Degree: "Bachelor's" or "Master's"
   - Subject: Select from dropdown
   - Budget: Enter min/max and currency
   - Source: "website"
3. Submit form
4. Verify success message
5. Check lead appears in admin dashboard

---

### 2. Staff Signup
**Route:** `/signup`  
**Endpoint:** `POST /api/auth/signup`

**Features:**
- Staff registration form
- Creates pending approval request
- Requires admin approval

**How to Test:**
1. Go to `http://localhost:3001/signup`
2. Fill in form:
   - Full Name: "Test Staff"
   - Email: "teststaff@example.com"
   - Password: "TestPassword123!"
3. Submit
4. Verify "Await admin approval" message
5. Check appears in admin "Approve Users" page

---

## 🔧 API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Login (admin/user/student)
- `POST /api/auth/signup` - Staff signup
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/me/password` - Change password
- `DELETE /api/auth/me` - Delete account

### Leads (Public)
- `POST /api/leads` - Submit lead

### Leads (Protected - Admin/Staff)
- `GET /api/v1/leads` - List leads (paginated, searchable, filterable)
- `GET /api/v1/leads/{id}` - Get specific lead
- `PATCH /api/v1/leads/{id}/status` - Update lead status
- `GET /api/v1/leads/stats` - Get lead statistics
- `GET /api/v1/leads/new-count` - Get count of new leads

### Admin
- `GET /api/admin/pending-users` - List pending approvals
- `GET /api/admin/pending-users/count` - Get pending count
- `POST /api/admin/pending-users/{id}/approve` - Approve user
- `POST /api/admin/pending-users/{id}/reject` - Reject user
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user

### Student Portal
- `GET /api/student/dashboard` - Dashboard stats
- `GET /api/student/documents` - List documents
- `POST /api/student/documents` - Upload document
- `GET /api/student/documents/checklist` - Get checklist
- `GET /api/student/applications` - List applications
- `POST /api/student/applications` - Create application
- `PATCH /api/student/applications/{id}/submit` - Submit application
- `GET /api/student/applications/compare` - Compare universities
- `GET /api/student/visa` - Get visa
- `POST /api/student/visa` - Create visa
- `GET /api/student/payments` - List payments
- `GET /api/student/messages` - List messages
- `POST /api/student/messages` - Send message
- `GET /api/student/timeline` - Get timeline events

---

## 🧪 Quick Test Checklist

### Admin Features
- [ ] Login as admin
- [ ] View leads table
- [ ] Search leads
- [ ] Update lead status
- [ ] View Kanban board
- [ ] Drag and drop leads
- [ ] View statistics
- [ ] Approve pending users
- [ ] Create/edit users
- [ ] View profile

### Student Features
- [ ] Login as student
- [ ] View dashboard
- [ ] Upload document
- [ ] View document checklist
- [ ] Create application
- [ ] Submit application
- [ ] Create visa application
- [ ] View payments
- [ ] Compare universities
- [ ] Send message
- [ ] View timeline

### Public Features
- [ ] Submit lead form
- [ ] Staff signup

---

## 🐛 Common Issues & Solutions

1. **Backend not starting:** Check if `python-multipart` is installed
2. **Login hanging:** Restart backend server
3. **CORS errors:** Verify frontend port (3001) is in CORS allowed origins
4. **Database errors:** Ensure database is initialized (`init_db()` runs on startup)
5. **File upload fails:** Check `uploads/documents/` directory exists and is writable

---

## 📝 Notes

- All timestamps are in UTC
- File uploads are stored in `uploads/documents/` directory
- Student accounts are linked to leads via `lead_id`
- Optimistic locking prevents concurrent update conflicts
- All protected routes require JWT authentication
- Role-based access: `admin` > `user` (staff) > `lead` (student)

