import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Users,
  Trophy,
  Trash2,
  UserPlus,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
  Megaphone,
  Send,
} from 'lucide-react';
import {
  ROOT_ADMIN_UID,
  fetchAllUsers,
  deleteUserDoc,
  fetchAllScores,
  deleteScoreDoc,
  fetchAllAdmins,
  addAdminUser,
  removeAdminUser,
  fetchAdminAnnouncements,
  sendAdminAnnouncement,
  deleteAdminAnnouncement,
  type AdminUserData,
  type AdminScoreData,
  type AdminRecordData,
  type AdminAnnouncementData,
} from '../lib/firebase';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdminUid: string;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentAdminUid,
}) => {
  const [activeTab, setActiveTab] = useState<'scores' | 'users' | 'admins' | 'announcements'>('scores');

  // Data states
  const [scores, setScores] = useState<AdminScoreData[]>([]);
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [admins, setAdmins] = useState<AdminRecordData[]>([]);
  const [announcements, setAnnouncements] = useState<AdminAnnouncementData[]>([]);

  // Loading & search states
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  // New Admin Form states
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Broadcast Push Announcement Form states
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [sendingNotice, setSendingNotice] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      if (activeTab === 'scores') {
        const data = await fetchAllScores();
        setScores(data);
      } else if (activeTab === 'users') {
        const data = await fetchAllUsers();
        setUsers(data);
      } else if (activeTab === 'admins') {
        const data = await fetchAllAdmins();
        setAdmins(data);
      } else if (activeTab === 'announcements') {
        const data = await fetchAdminAnnouncements();
        setAnnouncements(data);
      }
    } catch (err: unknown) {
      console.error('Error fetching admin data:', err);
      setStatusMsg({
        text: 'Error al obtener datos de la base de datos.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Handle Score Deletion
  const handleDeleteScore = async (scoreId: string, playerName: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la puntuación de "${playerName}"?`)) {
      return;
    }
    try {
      await deleteScoreDoc(scoreId);
      setScores((prev) => prev.filter((s) => s.id !== scoreId));
      setStatusMsg({ text: 'Puntuación eliminada con éxito.', type: 'success' });
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: 'No se pudo eliminar la puntuación.', type: 'error' });
    }
  };

  // Handle User Deletion
  const handleDeleteUser = async (userId: string, email: string) => {
    if (userId === ROOT_ADMIN_UID) {
      alert('No puedes eliminar al Administrador Principal (Root).');
      return;
    }
    if (
      !window.confirm(
        `¿Confirmas la eliminación del usuario con correo "${email}" (UID: ${userId})? Se borrará su perfil del sistema.`
      )
    ) {
      return;
    }
    try {
      await deleteUserDoc(userId);
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
      setStatusMsg({ text: `Usuario ${email} eliminado correctamente.`, type: 'success' });
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: 'Error al eliminar el usuario.', type: 'error' });
    }
  };

  // Handle Add Admin
  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUid.trim() || !newAdminEmail.trim()) {
      setStatusMsg({ text: 'UID y Correo son obligatorios.', type: 'error' });
      return;
    }
    setAddingAdmin(true);
    setStatusMsg(null);
    try {
      await addAdminUser(newAdminUid.trim(), newAdminEmail.trim(), newAdminName.trim());
      setNewAdminUid('');
      setNewAdminEmail('');
      setNewAdminName('');
      setStatusMsg({ text: '¡Nuevo administrador registrado exitosamente!', type: 'success' });
      // Reload admins
      const data = await fetchAllAdmins();
      setAdmins(data);
    } catch (err: unknown) {
      console.error(err);
      setStatusMsg({ text: 'No se pudo registrar al nuevo administrador.', type: 'error' });
    } finally {
      setAddingAdmin(false);
    }
  };

  // Handle Remove Admin
  const handleRemoveAdmin = async (adminId: string, email: string) => {
    if (adminId === ROOT_ADMIN_UID) {
      alert('El Administrador Principal no puede ser eliminado.');
      return;
    }
    if (!window.confirm(`¿Revocar permisos de administrador a ${email}?`)) {
      return;
    }
    try {
      await removeAdminUser(adminId);
      setAdmins((prev) => prev.filter((a) => a.adminId !== adminId));
      setStatusMsg({ text: `Permisos revocados a ${email}.`, type: 'success' });
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: 'Error al revocar permisos.', type: 'error' });
    }
  };

  // Promote a user from the Users table directly
  const handlePromoteUser = async (u: AdminUserData) => {
    if (!window.confirm(`¿Deseas ascender a ${u.displayName} (${u.email}) a Administrador?`)) {
      return;
    }
    try {
      await addAdminUser(u.userId, u.email, u.displayName);
      setStatusMsg({ text: `${u.displayName} ahora es Administrador.`, type: 'success' });
      setActiveTab('admins');
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: 'Error al promover usuario.', type: 'error' });
    }
  };

  // Send broadcast push announcement to all users
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      setStatusMsg({ text: 'Escribe un título y un mensaje para el aviso.', type: 'error' });
      return;
    }

    setSendingNotice(true);
    setStatusMsg(null);
    try {
      await sendAdminAnnouncement(noticeTitle, noticeMessage);
      setNoticeTitle('');
      setNoticeMessage('');
      setStatusMsg({
        text: '¡Aviso enviado! Todos los usuarios activos recibirán la notificación push.',
        type: 'success',
      });
      const data = await fetchAdminAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: 'No se pudo enviar el aviso push.', type: 'error' });
    } finally {
      setSendingNotice(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      await deleteAdminAnnouncement(announcementId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
      setStatusMsg({ text: 'Aviso eliminado del historial.', type: 'success' });
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: 'No se pudo eliminar el aviso.', type: 'error' });
    }
  };

  // Filtered lists
  const filteredScores = scores.filter(
    (s) =>
      s.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.userEmail && s.userEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl bg-amber-950 border-2 border-amber-600 rounded-3xl p-5 sm:p-7 text-amber-50 shadow-2xl overflow-y-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-900/80 border border-amber-500/60 text-amber-300">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black font-['Fredoka'] text-amber-300">
                  Panel de Administración
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-amber-950 uppercase tracking-wider">
                  Admin Master
                </span>
              </div>
              <p className="text-xs text-amber-200/70">
                Gestión de usuarios, auditoría de puntuaciones y control de permisos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-200'
                : 'bg-red-950/80 border border-red-800 text-red-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab Navigation & Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 p-1 bg-amber-900/50 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('scores');
                setSearchTerm('');
              }}
              className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'scores'
                  ? 'bg-amber-400 text-amber-950 shadow-sm'
                  : 'text-amber-200/80 hover:text-amber-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Puntuaciones ({scores.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('users');
                setSearchTerm('');
              }}
              className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-amber-400 text-amber-950 shadow-sm'
                  : 'text-amber-200/80 hover:text-amber-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Usuarios ({users.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('admins');
                setSearchTerm('');
              }}
              className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'admins'
                  ? 'bg-amber-400 text-amber-950 shadow-sm'
                  : 'text-amber-200/80 hover:text-amber-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Administradores ({admins.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('announcements');
                setSearchTerm('');
              }}
              className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'announcements'
                  ? 'bg-amber-400 text-amber-950 shadow-sm'
                  : 'text-amber-200/80 hover:text-amber-100'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Avisos Push</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'admins' && activeTab !== 'announcements' && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400/70" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-amber-950 border border-amber-800 text-xs text-amber-100 focus:outline-none focus:border-amber-400 w-36 sm:w-48"
                />
              </div>
            )}

            <button
              onClick={loadData}
              disabled={loading}
              title="Refrescar datos"
              className="p-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab 1: Scores Table */}
        {activeTab === 'scores' && (
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="text-center py-16 text-amber-200/70 text-xs">
                Cargando puntuaciones de todos los usuarios...
              </div>
            ) : filteredScores.length === 0 ? (
              <div className="text-center py-16 text-amber-200/60 text-xs">
                No se encontraron puntuaciones registradas.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-amber-900 text-amber-400 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Jugador</th>
                    <th className="py-2.5 px-3">Gmail / Contacto</th>
                    <th className="py-2.5 px-3 font-mono tabular-nums text-right">Puntaje</th>
                    <th className="py-2.5 px-3">Modo</th>
                    <th className="py-2.5 px-3 text-center">Precisión</th>
                    <th className="py-2.5 px-3 text-center">Racha</th>
                    <th className="py-2.5 px-3 text-center">Topos</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/40">
                  {filteredScores.map((s) => (
                    <tr key={s.id} className="hover:bg-amber-900/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-amber-100">{s.playerName}</td>
                      <td className="py-2.5 px-3 text-amber-300/80 font-mono text-[11px]">
                        {s.userEmail || 'Anónimo'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-300 text-right tabular-nums text-sm">
                        {s.score.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-amber-200/80">{s.mode}</td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-amber-200">
                        {s.accuracy}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400 tabular-nums">
                        x{s.maxCombo}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-amber-200">
                        {s.molesHit}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteScore(s.id, s.playerName)}
                          title="Eliminar puntuación"
                          className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-white border border-red-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Users Management (Delete users & Promote to admin) */}
        {activeTab === 'users' && (
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="text-center py-16 text-amber-200/70 text-xs">
                Cargando lista de usuarios...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16 text-amber-200/60 text-xs">
                No hay usuarios registrados que coincidan con la búsqueda.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-amber-900 text-amber-400 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Usuario</th>
                    <th className="py-2.5 px-3">Correo Gmail</th>
                    <th className="py-2.5 px-3">UID Firebase</th>
                    <th className="py-2.5 px-3 font-mono tabular-nums text-right">Mejor Récord</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/40">
                  {filteredUsers.map((u) => {
                    const isRoot = u.userId === ROOT_ADMIN_UID;
                    const isAdminUser = admins.some((a) => a.adminId === u.userId);

                    return (
                      <tr key={u.id} className="hover:bg-amber-900/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-amber-100 flex items-center gap-2">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.displayName}
                              referrerPolicy="no-referrer"
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-amber-800 flex items-center justify-center text-[10px] text-amber-200">
                              {u.displayName.charAt(0) || 'U'}
                            </div>
                          )}
                          <span>{u.displayName}</span>
                          {isRoot && (
                            <span className="text-[10px] bg-amber-500 text-amber-950 font-bold px-1.5 py-0.2 rounded">
                              ROOT
                            </span>
                          )}
                          {isAdminUser && !isRoot && (
                            <span className="text-[10px] bg-amber-800 text-amber-200 font-bold px-1.5 py-0.2 rounded">
                              ADMIN
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-amber-200 font-mono text-[11px]">{u.email}</td>
                        <td className="py-2.5 px-3 text-amber-300/70 font-mono text-[10px] max-w-[140px] truncate">
                          {u.userId}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300 text-right tabular-nums">
                          {u.bestScore ? u.bestScore.toLocaleString() : '0'} pts
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isAdminUser && (
                              <button
                                onClick={() => handlePromoteUser(u)}
                                title="Promover a Administrador"
                                className="px-2.5 py-1 rounded-lg bg-amber-900/70 hover:bg-amber-800 text-amber-200 border border-amber-700 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Hacer Admin
                              </button>
                            )}

                            {!isRoot && (
                              <button
                                onClick={() => handleDeleteUser(u.userId, u.email)}
                                title="Eliminar usuario"
                                className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-white border border-red-800 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Admins Management (Add new admin by UID/Email & remove) */}
        {activeTab === 'admins' && (
          <div className="flex-1 space-y-6">
            {/* Form to add a new admin */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-900/40 border border-amber-800/80">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Dar de Alta Nuevo Usuario Administrador</span>
              </h3>

              <form onSubmit={handleAddAdminSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-amber-200/80 block mb-1">
                    UID de Firebase *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. H6QC4mER9SZmL58..."
                    value={newAdminUid}
                    onChange={(e) => setNewAdminUid(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-amber-950 border border-amber-700 text-xs text-amber-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-amber-200/80 block mb-1">
                    Correo Gmail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@gmail.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-amber-950 border border-amber-700 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-amber-200/80 block mb-1">
                    Nombre o Cargo (Opcional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej. Moderador"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-amber-950 border border-amber-700 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={addingAdmin}
                      className="px-4 py-2 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {addingAdmin ? 'Registrando...' : 'Dar de Alta'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* List of current administrators */}
            <div>
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3">
                Administradores con Acceso Activo
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-amber-900 text-amber-400 uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Administrador</th>
                      <th className="py-2.5 px-3">Correo</th>
                      <th className="py-2.5 px-3">UID Firebase</th>
                      <th className="py-2.5 px-3">Alta Por</th>
                      <th className="py-2.5 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/40">
                    {admins.map((adm) => {
                      const isRoot = adm.adminId === ROOT_ADMIN_UID;
                      return (
                        <tr key={adm.id} className="hover:bg-amber-900/30 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-amber-100 flex items-center gap-2">
                            <span>{adm.displayName || 'Admin'}</span>
                            {isRoot ? (
                              <span className="text-[10px] bg-amber-500 text-amber-950 font-bold px-1.5 py-0.2 rounded">
                                ROOT
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-800 text-amber-200 font-bold px-1.5 py-0.2 rounded">
                                ADMIN
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-amber-200 font-mono text-[11px]">
                            {adm.email}
                          </td>
                          <td className="py-2.5 px-3 text-amber-300/70 font-mono text-[10px]">
                            {adm.adminId}
                          </td>
                          <td className="py-2.5 px-3 text-amber-200/60 text-[11px]">
                            {adm.addedBy || 'Directo'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isRoot ? (
                              <span className="text-[11px] text-amber-400/60 font-semibold italic">
                                Protegido
                              </span>
                            ) : (
                              <button
                                onClick={() => handleRemoveAdmin(adm.adminId, adm.email)}
                                title="Revocar permisos"
                                className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-white border border-red-800 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Push Broadcast Announcements */}
        {activeTab === 'announcements' && (
          <div className="flex-1 space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-900/40 border border-amber-800/80">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>Enviar Aviso por Notificación Push a Todos los Usuarios</span>
              </h3>
              <p className="text-xs text-amber-200/75 mb-4">
                El mensaje se enviará como notificación push a los jugadores conectados y a quienes abran la aplicación.
              </p>

              <form onSubmit={handleSendAnnouncement} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="admin-notice-title"
                      className="text-[11px] font-semibold text-amber-200/80"
                    >
                      Título del aviso *
                    </label>
                    <span className="text-[10px] text-amber-300/60 tabular-nums">
                      {noticeTitle.length}/100
                    </span>
                  </div>
                  <input
                    id="admin-notice-title"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Ej. ¡Nuevo evento de fin de semana!"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    disabled={sendingNotice}
                    className="w-full px-3 py-2 rounded-xl bg-amber-950 border border-amber-700 text-xs text-amber-100 focus:outline-none focus:border-amber-400 disabled:opacity-60"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="admin-notice-message"
                      className="text-[11px] font-semibold text-amber-200/80"
                    >
                      Mensaje de la notificación *
                    </label>
                    <span className="text-[10px] text-amber-300/60 tabular-nums">
                      {noticeMessage.length}/500
                    </span>
                  </div>
                  <textarea
                    id="admin-notice-message"
                    required
                    rows={3}
                    maxLength={500}
                    placeholder="Escribe el aviso que verán todos los jugadores en su notificación push..."
                    value={noticeMessage}
                    onChange={(e) => setNoticeMessage(e.target.value)}
                    disabled={sendingNotice}
                    className="w-full px-3 py-2 rounded-xl bg-amber-950 border border-amber-700 text-xs text-amber-100 focus:outline-none focus:border-amber-400 resize-y disabled:opacity-60"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sendingNotice || !noticeTitle.trim() || !noticeMessage.trim()}
                    className="px-4 py-2.5 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingNotice ? 'Enviando aviso...' : 'Enviar Notificación Push'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Sent Announcements History */}
            <div>
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3">
                Historial de Avisos Enviados ({announcements.length})
              </h3>

              {loading ? (
                <div className="text-center py-10 text-amber-200/70 text-xs">
                  Cargando historial de avisos...
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-10 rounded-2xl bg-amber-900/20 border border-amber-900/50 text-amber-200/60 text-xs">
                  Aún no se han enviado avisos globales.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {announcements.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-amber-900/35 border border-amber-800/70 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-amber-200">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-amber-300/70 font-mono">
                            {new Date(item.createdAtMs).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-amber-100/85 mt-1 leading-relaxed break-words">
                          {item.message}
                        </p>
                        <span className="text-[11px] text-amber-300/60 mt-1.5 block">
                          Por: {item.senderName}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteAnnouncement(item.id)}
                        title="Eliminar aviso"
                        className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-white border border-red-800 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-amber-900 flex justify-between items-center text-xs text-amber-300/80">
          <div>
            Sesión actual: <span className="font-mono text-amber-200">{currentAdminUid}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold bg-amber-400 text-amber-950 hover:bg-amber-300 transition-colors cursor-pointer text-xs"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};
