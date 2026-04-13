import React, { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import SidePanel from '../../components/ui/SidePanel';

type Tab = 'Students' | 'Wardens' | 'Guards';

const AdminUsersPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('Students');
  const [search, setSearch] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);

  // Mock users mapping for demo purposes
  const users: any[] = [
    { id: '1', name: 'Harsh Verma', usn: '1DS22CS042', role: 'student', hostel: 'Cauvery', status: 'Active' },
    { id: '2', name: 'Riya Sharma', usn: '1DS22EC078', role: 'student', hostel: 'Tungabhadra', status: 'Active' },
    { id: '3', name: 'Dr. Ramesh Kumar', role: 'warden', hostel: 'Cauvery', contact: '+91 98450 01234', status: 'Active' },
    { id: '4', name: 'Mrs. Anitha Rao', role: 'warden', hostel: 'Tungabhadra', contact: '+91 98450 02345', status: 'Active' },
    { id: '5', name: 'Suresh Babu', role: 'guard', shift: 'Morning', contact: '+91 99001 23456', status: 'Active' },
    { id: '6', name: 'Mohan Das', role: 'guard', shift: 'Evening', contact: '+91 99002 34567', status: 'Suspended' },
  ];

  const filteredUsers = users.filter(u => {
    if (tab === 'Students' && u.role !== 'student') return false;
    if (tab === 'Wardens' && u.role !== 'warden') return false;
    if (tab === 'Guards' && u.role !== 'guard') return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 page-enter h-[calc(100vh-100px)] flex flex-col max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold font-sora text-text-primary">User Management</h1>
          <p className="text-text-muted mt-1 text-sm">Manage access across all roles in the institution.</p>
        </div>
        <button 
          onClick={() => setShowAddUser(true)}
          className="btn btn-primary shadow-sm"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
        
        {/* Header/Tabs */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between gap-4 flex-shrink-0">
          <div className="flex gap-2 bg-bg-muted p-1 rounded-lg w-fit">
             {(['Students', 'Wardens', 'Guards'] as Tab[]).map(t => (
               <button
                 key={t}
                 onClick={() => setTab(t)}
                 className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
               >
                 {t}
               </button>
             ))}
          </div>

          <div className="relative max-w-xs w-full flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-input bg-white focus:border-accent-primary outline-none"
              />
            </div>
            <button className="btn btn-secondary px-3 py-2 text-sm bg-bg-muted">
               <Filter size={14} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <table className="data-table">
            <thead className="sticky top-0 bg-bg-muted z-10">
              <tr>
                <th>Name</th>
                {tab === 'Students' && <th>USN</th>}
                {tab === 'Students' && <th>Hostel</th>}
                {tab === 'Wardens' && <th>Hostel Managed</th>}
                {tab === 'Wardens' && <th>Contact</th>}
                {tab === 'Guards' && <th>Shift</th>}
                {tab === 'Guards' && <th>Contact</th>}
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-bg-muted transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-text-primary flex items-center justify-center font-bold text-xs shadow-sm">
                        {user.name[0]}
                      </div>
                      <div className="font-semibold text-text-primary">{user.name}</div>
                    </div>
                  </td>
                  {tab === 'Students' && <td className="font-mono text-sm">{user.usn}</td>}
                  {(tab === 'Students' || tab === 'Wardens') && <td className="text-sm">{user.hostel}</td>}
                  {(tab === 'Wardens' || tab === 'Guards') && <td className="font-mono text-sm text-text-secondary">{user.contact}</td>}
                  {tab === 'Guards' && <td className="text-sm">{user.shift}</td>}
                  <td>
                    <span className={`px-2 py-0.5 rounded-badge text-[10px] font-bold uppercase tracking-wider border ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="text-right whitespace-nowrap space-x-2">
                    <button className="text-xs font-semibold text-accent-primary hover:underline">Edit</button>
                    <span className="text-border">|</span>
                    {user.status === 'Active' 
                      ? <button className="text-xs font-semibold text-red-500 hover:underline">Suspend</button>
                      : <button className="text-xs font-semibold text-emerald-500 hover:underline">Reactivate</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SidePanel 
        open={showAddUser} 
        onClose={() => setShowAddUser(false)}
        title="Add New User"
      >
        <div className="p-6 space-y-6">
          <div className="float-label-group">
            <select defaultValue="student" className="appearance-none">
              <optgroup label="Select Role">
                <option value="student">Student</option>
                <option value="warden">Warden</option>
                <option value="guard">Security Guard</option>
              </optgroup>
            </select>
            <label>User Role</label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 float-label-group">
              <input type="text" placeholder=" " />
              <label>Full Name</label>
            </div>
            <div className="float-label-group">
              <input type="email" placeholder=" " />
              <label>Email Address</label>
            </div>
            <div className="float-label-group">
              <input type="tel" placeholder=" " />
              <label>Mobile Number</label>
            </div>
          </div>
          
          <hr className="border-border" />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="float-label-group">
              <input type="text" placeholder=" " />
              <label>USN / ID</label>
            </div>
            <div className="float-label-group">
              <select defaultValue="" className="appearance-none">
                <option value="" disabled></option>
                <option value="1">Cauvery Boys</option>
                <option value="2">Tungabhadra Girls</option>
              </select>
              <label>Hostel Assignment</label>
            </div>
          </div>

          <div className="pt-6">
            <button className="btn btn-primary w-full h-12 text-[15px]" onClick={() => setShowAddUser(false)}>
              Send Invite Link
            </button>
          </div>
        </div>
      </SidePanel>
    </div>
  );
};

export default AdminUsersPage;
