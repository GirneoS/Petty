import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  addPet,
  applyToOrder,
  assignSitter,
  createOrder,
  login,
  logout,
  registerOwner,
  registerSitter,
  sendMessage,
} from './store.js'
import './App.css'

function LandingPage({ onStart }) {
  return (
    <div className="landing-shell">
      <div className="landing-pattern" aria-hidden></div>
      <div className="landing-content">
        <div className="landing-header">
          <div className="brand-mark landing-logo">Petty</div>
        </div>
        <div className="landing-main">
          <h1 className="landing-title">
            Мы Petty! Компания, которая поможет проследить за вашими питомцами.
          </h1>
          <button className="landing-button" onClick={onStart}>
            Тыкни сюда и начнем!
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { auth, owners, sitters, orders, authError } = useSelector(
    (state) => state.app,
  )
  const [showLanding, setShowLanding] = useState(true)

  const currentUser =
    auth.role === 'owner'
      ? owners.find((owner) => owner.id === auth.userId)
      : sitters.find((sitter) => sitter.id === auth.userId)

  const defaultPath = auth.role === 'owner' ? '/owner/profile' : '/sitter/profile'

  useEffect(() => {
    if (currentUser && location.pathname === '/') {
      navigate(defaultPath, { replace: true })
    }
  }, [currentUser, defaultPath, location.pathname, navigate])

  if (!currentUser && showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />
  }

  if (!currentUser) {
    return (
      <div className="auth-shell">
        <div className="auth-panel">
          <BrandBlock compact />
          <AuthPanel dispatch={dispatch} authError={authError} />
        </div>
        <div className="auth-pattern" aria-hidden></div>
      </div>
    )
  }

  const menu =
    auth.role === 'owner'
      ? [
          { path: '/owner/profile', label: 'Личный кабинет' },
          { path: '/owner/pets', label: 'Мои питомцы' },
          { path: '/owner/orders', label: 'Мои заказы' },
        ]
      : [
          { path: '/sitter/profile', label: 'Личный кабинет' },
          { path: '/sitter/available', label: 'Доступные заказы' },
          { path: '/sitter/active', label: 'Взятые заказы' },
        ]

  return (
    <div className="app-shell light">
      <header className="topbar beige">
        <BrandBlock />
        <div className="user-pill">
          <div>
            <p className="pill-label">
              {auth.role === 'owner' ? 'Владелец' : 'Ситтер'}
            </p>
            <p className="pill-title">{currentUser.fullName}</p>
            <p className="muted">
              {currentUser.city} · {currentUser.email}
            </p>
          </div>
          <button
            className="ghost-button"
            type="button"
            onClick={() => dispatch(logout())}
          >
            Выйти
          </button>
        </div>
      </header>

      <div className="layout">
        <Sidebar items={menu} />
        <div className="content">
          <Routes>
            <Route path="/" element={<Navigate to={defaultPath} replace />} />
            {auth.role === 'owner' ? (
              <>
                <Route
                  path="/owner/profile"
                  element={<OwnerProfile owner={currentUser} />}
                />
                <Route
                  path="/owner/pets"
                  element={
                    <PetsPage owner={currentUser} dispatch={dispatch} key={currentUser.id} />
                  }
                />
                <Route
                  path="/owner/orders"
                  element={
                    <OwnerOrdersPage
                      owner={currentUser}
                      orders={orders}
                      sitters={sitters}
                      dispatch={dispatch}
                    />
                  }
                />
                <Route
                  path="/owner/orders/:orderId/chat"
                  element={
                    <ChatPage
                      role="owner"
                      orders={orders}
                      owners={owners}
                      sitters={sitters}
                      currentUserId={currentUser.id}
                      dispatch={dispatch}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/owner/profile" replace />} />
              </>
            ) : (
              <>
                <Route
                  path="/sitter/profile"
                  element={<SitterProfile sitter={currentUser} />}
                />
                <Route
                  path="/sitter/available"
                  element={
                    <AvailableOrdersPage
                      sitter={currentUser}
                      orders={orders}
                      owners={owners}
                      dispatch={dispatch}
                    />
                  }
                />
                <Route
                  path="/sitter/active"
                  element={
                    <ActiveOrdersPage
                      sitter={currentUser}
                      orders={orders}
                      owners={owners}
                      dispatch={dispatch}
                    />
                  }
                />
                <Route
                  path="/sitter/orders/:orderId/chat"
                  element={
                    <ChatPage
                      role="sitter"
                      orders={orders}
                      owners={owners}
                      sitters={sitters}
                      currentUserId={currentUser.id}
                      dispatch={dispatch}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/sitter/profile" replace />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </div>
  )
}

function AuthPanel({ dispatch, authError }) {
  const [role, setRole] = useState('owner')
  const [mode, setMode] = useState('login')
  const [localInfo, setLocalInfo] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    age: '',
    about: '',
    rating: '4.8',
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    setLocalInfo('')

    if (!form.email || !form.password) {
      setLocalInfo('Введите email и пароль')
      return
    }

    if (mode === 'login') {
      dispatch(
        login({
          role,
          email: form.email,
          password: form.password,
        }),
      )
      return
    }

    if (role === 'owner') {
      dispatch(
        registerOwner({
          fullName: form.fullName || 'Новый владелец',
          email: form.email,
          password: form.password,
          phone: form.phone,
          city: form.city || 'Город не указан',
        }),
      )
      setLocalInfo('Аккаунт владельца создан и авторизован')
    } else {
      dispatch(
        registerSitter({
          fullName: form.fullName || 'Новый ситтер',
          email: form.email,
          password: form.password,
          phone: form.phone,
          city: form.city || 'Город не указан',
          age: Number(form.age) || 20,
          rating: Number(form.rating) || 4.5,
          about: form.about,
        }),
      )
      setLocalInfo('Ситтер создан, можно откликаться на заказы')
    }
  }

  return (
    <div className="auth-card beige">
      <div className="panel-header">
        <div className="pill-switch">
          <button
            type="button"
            className={role === 'owner' ? 'active' : ''}
            onClick={() => setRole('owner')}
          >
            Владелец
          </button>
          <button
            type="button"
            className={role === 'sitter' ? 'active' : ''}
            onClick={() => setRole('sitter')}
          >
            Ситтер
          </button>
        </div>
        <div className="mode-switch">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Вход
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Регистрация
          </button>
        </div>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          {mode === 'register' && (
            <label>
              ФИО
              <input
                type="text"
                placeholder="Анна Морозова"
                value={form.fullName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              required
              placeholder="you@petty.ru"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              required
              placeholder="******"
              maxLength={30}
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
            />
          </label>
          {mode === 'register' && (
            <>
              <label>
                Телефон
                <input
                  type="text"
                  placeholder="+7 999 000-00-00"
                  maxLength={16}
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </label>
              <label>
                Город
                <input
                  type="text"
                  placeholder="Москва"
                  value={form.city}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </label>
              {role === 'sitter' && (
                <>
                  <label>
                    Возраст
                    <input
                      type="number"
                      min="18"
                      placeholder="26"
                      value={form.age}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, age: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Рейтинг
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={form.rating}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, rating: e.target.value }))
                      }
                    />
                  </label>
                  <label className="wide">
                    О себе
                    <textarea
                      placeholder="Опишите опыт и комфортных питомцев"
                      value={form.about}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, about: e.target.value }))
                      }
                    />
                  </label>
                </>
              )}
            </>
          )}
        </div>
        <button type="submit" className="primary-button">
          {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
        </button>
        <div className="form-info">
          {localInfo && <span className="ok">{localInfo}</span>}
          {authError && <span className="error">{authError}</span>}
          {!localInfo && !authError && (
            <span className="hint">
              Демо-доступ: владелец anna@petty.ru / petty123, ситтер maria@petty.ru /
              petty123.
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

function Sidebar({ items }) {
  const location = useLocation()

  return (
    <aside className="sidebar">
      <nav>
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={location.pathname === item.path ? 'nav-item active' : 'nav-item'}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

function OwnerProfile({ owner }) {
  return (
    <div className="panel beige">
      <PageHeader title="Личный кабинет" subtitle="Контакты и профиль владельца" />
      <div className="profile-grid">
        <ProfileItem label="ФИО" value={owner.fullName} />
        <ProfileItem label="Email" value={owner.email} />
        <ProfileItem label="Телефон" value={owner.phone} />
        <ProfileItem label="Город" value={owner.city} />
        <ProfileItem label="Питомцев" value={owner.pets.length} />
      </div>
    </div>
  )
}

function SitterProfile({ sitter }) {
  return (
    <div className="panel beige">
      <PageHeader title="Личный кабинет" subtitle="Контакты и опыт ситтера" />
      <div className="profile-grid">
        <ProfileItem label="ФИО" value={sitter.fullName} />
        <ProfileItem label="Email" value={sitter.email} />
        <ProfileItem label="Телефон" value={sitter.phone} />
        <ProfileItem label="Город" value={sitter.city} />
        <ProfileItem label="Возраст" value={`${sitter.age} лет`} />
        <ProfileItem label="Рейтинг" value={sitter.rating} />
      </div>
      {sitter.about && <p className="muted top-gap">{sitter.about}</p>}
    </div>
  )
}

function PetsPage({ owner, dispatch }) {
  const [petForm, setPetForm] = useState({
    family: '',
    gender: '',
    age: '',
    name: '',
    breed: '',
  })
  const [isPetModalOpen, setIsPetModalOpen] = useState(false)

  const handlePetSubmit = (event) => {
    event.preventDefault()
    if (!petForm.name) return
    dispatch(
      addPet({
        ownerId: owner.id,
        pet: {
          ...petForm,
          age: Number(petForm.age) || 0,
        },
      }),
    )
    setPetForm({
      family: '',
      gender: '',
      age: '',
      name: '',
      breed: '',
    })
    setIsPetModalOpen(false)
  }

  return (
    <div className="panel beige">
      <PageHeader
        title="Мои питомцы"
        subtitle="Карточки любимцев, которых можно указать в заказах"
        action={
          <button
            type="button"
            className="primary-button"
            onClick={() => setIsPetModalOpen(true)}
          >
            Добавить питомца
          </button>
        }
      />
      <div className="cards-grid">
        {owner.pets.map((pet) => (
          <div className="card" key={pet.id}>
            <div className="card-head">
              <h4>{pet.name}</h4>
              <span className="badge muted">Возраст {pet.age}</span>
            </div>
            <p className="muted">{pet.family}</p>
            <ul className="details">
              <li>Пол: {pet.gender || '—'}</li>
              <li>Порода: {pet.breed || '—'}</li>
            </ul>
          </div>
        ))}
        {owner.pets.length === 0 && (
          <div className="card">
            <p className="muted">Питомцев пока нет — добавьте первого.</p>
          </div>
        )}
      </div>

      {isPetModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal beige">
            <div className="modal-head">
              <h4>Зарегистрировать питомца</h4>
              <button className="ghost-button" onClick={() => setIsPetModalOpen(false)}>
                Закрыть
              </button>
            </div>
            <form className="mini-form" onSubmit={handlePetSubmit}>
              <input
                type="text"
                placeholder="Имя"
                value={petForm.name}
                onChange={(e) =>
                  setPetForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
              <input
                type="text"
                placeholder="Семейство (кот, собака...)"
                value={petForm.family}
                onChange={(e) =>
                  setPetForm((prev) => ({ ...prev, family: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Пол"
                value={petForm.gender}
                onChange={(e) =>
                  setPetForm((prev) => ({ ...prev, gender: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Порода"
                value={petForm.breed}
                onChange={(e) =>
                  setPetForm((prev) => ({ ...prev, breed: e.target.value }))
                }
              />
              <input
                type="number"
                min="0"
                placeholder="Возраст"
                value={petForm.age}
                onChange={(e) =>
                  setPetForm((prev) => ({ ...prev, age: e.target.value }))
                }
              />
              <button type="submit" className="primary-button">
                Сохранить
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function OwnerOrdersPage({ owner, orders, sitters, dispatch }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({
    petId: owner.pets[0]?.id || '',
    date: '',
    address: '',
    comment: '',
  })

  const ownerOrders = useMemo(
    () => orders.filter((order) => order.ownerId === owner.id),
    [orders, owner.id],
  )

  const handleOrderSubmit = (event) => {
    event.preventDefault()
    if (!orderForm.petId || !orderForm.date || !orderForm.address) return
    dispatch(
      createOrder({
        ownerId: owner.id,
        petId: orderForm.petId,
        date: orderForm.date,
        address: orderForm.address,
        comment: orderForm.comment,
      }),
    )
    setOrderForm((prev) => ({
      ...prev,
      comment: '',
      address: '',
      date: '',
    }))
    setIsModalOpen(false)
  }

  return (
    <div className="panel beige">
      <PageHeader
        title="Мои заказы"
        subtitle="Создавайте заказы, выбирайте ситтеров по рейтингу и переходите в чат"
        action={
          <button
            type="button"
            className="primary-button"
            onClick={() => setIsModalOpen(true)}
            disabled={owner.pets.length === 0}
          >
            Создать заказ
          </button>
        }
      />

      <div className="cards-grid">
        {ownerOrders.length === 0 && (
          <div className="card">
            <p className="muted">Заказов пока нет — создайте первый.</p>
          </div>
        )}
        {ownerOrders.map((order) => {
          const pet = owner.pets.find((item) => item.id === order.petId)
          const assignedSitter = sitters.find(
            (sitter) => sitter.id === order.assignedSitterId,
          )
          const applicants = order.applicants
            .map((id) => sitters.find((sitter) => sitter.id === id))
            .filter(Boolean)

          return (
            <div className="card order-card" key={order.id}>
              <div className="card-head">
                <div>
                  <p className="eyebrow">{order.date}</p>
                  <h4>{pet ? pet.name : 'Питомец'}</h4>
                  <p className="muted">{order.address}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <p>{order.comment || 'Без комментария'}</p>
              <div className="order-meta">
                <span>Питомец: {pet ? pet.family : '—'}</span>
                <span>Отклики: {applicants.length}</span>
              </div>
              <div className="applicants">
                <h5>Ситтеры-откликнувшиеся</h5>
                {applicants.length === 0 && (
                  <p className="muted">Пока нет откликов.</p>
                )}
                {applicants.map((sitter) => (
                  <div className="applicant" key={sitter.id}>
                    <div>
                      <p className="pill-title">{sitter.fullName}</p>
                      <p className="muted">
                        Рейтинг {sitter.rating} · {sitter.city}
                      </p>
                    </div>
                    {order.assignedSitterId === sitter.id ? (
                      <span className="badge success">Назначен</span>
                    ) : (
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() =>
                          dispatch(assignSitter({ orderId: order.id, sitterId: sitter.id }))
                        }
                      >
                        Выбрать
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="order-actions">
                <Link
                  to={`/owner/orders/${order.id}/chat`}
                  className={`ghost-button ${!order.assignedSitterId ? 'ghost-disabled' : ''}`}
                >
                  Перейти в чат
                </Link>
                {!order.assignedSitterId && (
                  <p className="muted small">Чат активируется после назначения ситтера</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal beige">
            <div className="modal-head">
              <h4>Новый заказ</h4>
              <button className="ghost-button" onClick={() => setIsModalOpen(false)}>
                Закрыть
              </button>
            </div>
            {owner.pets.length === 0 ? (
              <p className="muted">Сначала добавьте питомца.</p>
            ) : (
              <form className="order-grid" onSubmit={handleOrderSubmit}>
                <label>
                  Питомец
                  <select
                    value={orderForm.petId}
                    onChange={(e) =>
                      setOrderForm((prev) => ({ ...prev, petId: e.target.value }))
                    }
                    required
                  >
                    <option value="">Выберите питомца</option>
                    {owner.pets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.name} · {pet.family}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Дата
                  <input
                    type="date"
                    value={orderForm.date}
                    onChange={(e) =>
                      setOrderForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Адрес
                  <input
                    type="text"
                    placeholder="Город, улица, дом"
                    value={orderForm.address}
                    onChange={(e) =>
                      setOrderForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="wide">
                  Комментарий
                  <textarea
                    placeholder="Особенности прогулки, питания или общения"
                    value={orderForm.comment}
                    onChange={(e) =>
                      setOrderForm((prev) => ({ ...prev, comment: e.target.value }))
                    }
                  />
                </label>
                <button type="submit" className="primary-button">
                  Разместить заказ
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AvailableOrdersPage({ sitter, orders, owners, dispatch }) {
  const [showInfoModal, setShowInfoModal] = useState(false)

  const availableOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === 'open' && !order.applicants.includes(sitter.id),
      ),
    [orders, sitter.id],
  )

  const handleApply = (orderId) => {
    dispatch(applyToOrder({ orderId, sitterId: sitter.id }))
    setShowInfoModal(true)
  }

  return (
    <div className="panel beige">
      <PageHeader title="Доступные заказы" subtitle="Откликайтесь на задания владельцев" />
      <div className="cards-grid">
        {availableOrders.length === 0 && (
          <div className="card">
            <p className="muted">Нет открытых заказов. Загляните позже.</p>
          </div>
        )}
        {availableOrders.map((order) => {
          const owner = owners.find((item) => item.id === order.ownerId)
          const pet =
            owner?.pets.find((petItem) => petItem.id === order.petId) || null
          return (
            <div className="card order-card" key={order.id}>
              <div className="card-head">
                <div>
                  <p className="eyebrow">{order.date}</p>
                  <h4>{pet ? pet.name : 'Питомец'}</h4>
                  <p className="muted">
                    {owner?.city} · {owner?.fullName}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <p>{order.comment}</p>
              <div className="order-meta">
                <span>Адрес: {order.address}</span>
                <span>Питомец: {pet ? pet.family : '—'}</span>
              </div>
              <div className="order-actions">
                <button
                  type="button"
                  className="primary-button full"
                  onClick={() => handleApply(order.id)}
                >
                  Откликнуться
                </button>
                <Link
                  to={`/sitter/orders/${order.id}/chat`}
                  className="ghost-button ghost-disabled"
                >
                  Перейти в чат
                </Link>
                <p className="muted small">Чат откроется после назначения</p>
              </div>
            </div>
          )
        })}
      </div>

      {showInfoModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal beige info-modal">
            <div className="modal-head">
              <h4>Отклик отправлен</h4>
              <button 
                className="close-button" 
                onClick={() => setShowInfoModal(false)}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>
            <div className="info-modal-content">
              <p>
                Вы откликнулись на заказ. Скоро этот заказ добавится у вас во вкладку "Взятые заказы". 
                После этого будет доступен чат с клиентом.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActiveOrdersPage({ sitter, orders, owners, dispatch }) {
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.assignedSitterId === sitter.id ||
          (order.status === 'assigned' && order.applicants.includes(sitter.id)),
      ),
    [orders, sitter.id],
  )

  return (
    <div className="panel beige">
      <PageHeader title="Взятые заказы" subtitle="Текущие задания и переписка" />
      <div className="cards-grid">
        {activeOrders.length === 0 && (
          <div className="card">
            <p className="muted">Нет назначенных заказов.</p>
          </div>
        )}
        {activeOrders.map((order) => {
          const owner = owners.find((item) => item.id === order.ownerId)
          const pet =
            owner?.pets.find((petItem) => petItem.id === order.petId) || null
          return (
            <div className="card order-card" key={order.id}>
              <div className="card-head">
                <div>
                  <p className="eyebrow">{order.date}</p>
                  <h4>{pet ? pet.name : 'Питомец'}</h4>
                  <p className="muted">{order.address}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <p>{order.comment}</p>
              <div className="order-meta">
                <span>Владелец: {owner?.fullName}</span>
                <span>Контакты: {owner?.phone}</span>
              </div>
              <div className="order-actions">
                <Link to={`/sitter/orders/${order.id}/chat`} className="ghost-button">
                  Перейти в чат
                </Link>
              </div>
              <ChatPanel
                order={order}
                owners={owners}
                sitters={[sitter]}
                currentRole="sitter"
                currentUserId={sitter.id}
                dispatch={dispatch}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChatPage({ role, orders, owners, sitters, currentUserId, dispatch }) {
  const { orderId } = useParams()
  const order = orders.find((item) => item.id === orderId)
  const backLink = role === 'owner' ? '/owner/orders' : '/sitter/active'

  if (!order) {
    return (
      <div className="panel beige">
        <PageHeader title="Чат заказа" subtitle="Заказ не найден" />
        <Link to={backLink} className="ghost-button">
          Вернуться назад
        </Link>
      </div>
    )
  }

  if (role === 'owner' && order.ownerId !== currentUserId) {
    return (
      <div className="panel beige">
        <PageHeader title="Чат заказа" subtitle="Нет доступа к этому заказу" />
        <Link to={backLink} className="ghost-button">
          Вернуться
        </Link>
      </div>
    )
  }

  if (role === 'sitter' && order.assignedSitterId !== currentUserId) {
    return (
      <div className="panel beige">
        <PageHeader title="Чат заказа" subtitle="Чат доступен только назначенному ситтеру" />
        <Link to={backLink} className="ghost-button">
          Вернуться
        </Link>
      </div>
    )
  }

  return (
    <div className="panel beige">
      <PageHeader
        title="Чат заказа"
        subtitle="Обсуждайте детали с другой стороной"
        action={
          <Link to={backLink} className="ghost-button">
            Назад к списку
          </Link>
        }
      />
      <ChatPanel
        order={order}
        owners={owners}
        sitters={sitters}
        currentRole={role}
        currentUserId={currentUserId}
        dispatch={dispatch}
      />
    </div>
  )
}

function BrandBlock({ compact }) {
  return (
    <div className="brand">
      <div className="brand-mark">Petty</div>
      {!compact && (
        <div>
          <p className="brand-eyebrow">Сервис поиска ситтеров</p>
          <p className="brand-subtitle">
            Биржа заказов с чатами и личными кабинетами владельцев и ситтеров.
          </p>
        </div>
      )}
    </div>
  )
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="panel-header space-between">
      <div>
        <p className="eyebrow">{subtitle}</p>
        <h3>{title}</h3>
      </div>
      {action}
    </div>
  )
}

function ProfileItem({ label, value }) {
  return (
    <div className="profile-item">
      <p className="muted">{label}</p>
      <p className="pill-title">{value || '—'}</p>
    </div>
  )
}

function ChatPanel({
  order,
  owners,
  sitters,
  currentRole,
  currentUserId,
  dispatch,
}) {
  const [message, setMessage] = useState('')
  const owner = owners.find((item) => item.id === order.ownerId)
  const sitter = sitters.find((item) => item.id === order.assignedSitterId)
  const messages = [...order.chat].sort((a, b) => a.timestamp - b.timestamp)

  const canSend =
    currentRole === 'owner'
      ? order.assignedSitterId !== null
      : order.assignedSitterId === currentUserId

  const handleSend = (event) => {
    event.preventDefault()
    if (!message.trim() || !canSend) return
    dispatch(
      sendMessage({
        orderId: order.id,
        senderRole: currentRole,
        senderId: currentUserId,
        text: message.trim(),
      }),
    )
    setMessage('')
  }

  return (
    <div className="chat">
      <div className="chat-head">
        <h5>Чат владельца и ситтера</h5>
        {owner && sitter && (
          <p className="muted">
            {owner.fullName} ↔ {sitter.fullName}
          </p>
        )}
      </div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="muted">Переписка начнется после первого сообщения.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`bubble ${msg.senderRole === 'owner' ? 'owner' : 'sitter'}`}
          >
            <div className="bubble-header">
              <span className="bubble-author">
                {msg.senderRole === 'owner'
                  ? owner?.fullName || 'Владелец'
                  : sitter?.fullName || 'Ситтер'}
              </span>
              <span className="muted">{formatTime(msg.timestamp)}</span>
            </div>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Напишите сообщение..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!canSend}
        />
        <button type="submit" className="ghost-button" disabled={!canSend}>
          Отправить
        </button>
      </form>
      {!canSend && (
        <p className="muted">Чат доступен только после назначения ситтера.</p>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    open: { label: 'Открыт', className: 'badge info' },
    assigned: { label: 'Назначен', className: 'badge success' },
    completed: { label: 'Завершен', className: 'badge muted' },
  }
  const item = map[status] || map.open
  return <span className={item.className}>{item.label}</span>
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  })
}

export default App
