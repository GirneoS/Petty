import { configureStore, createSlice, nanoid } from '@reduxjs/toolkit'

const defaultState = {
  auth: {
    role: null,
    userId: null,
  },
  authError: null,
  owners: [
    {
      id: 'owner-1',
      fullName: 'Анна Морозова',
      email: 'anna@petty.ru',
      password: 'petty123',
      phone: '+7 999 111-22-33',
      city: 'Санкт-Петербург',
      pets: [
        {
          id: 'pet-1',
          family: 'Собака',
          gender: 'Мальчик',
          age: 3,
          name: 'Роки',
          height: 45,
        },
        {
          id: 'pet-2',
          family: 'Кошка',
          gender: 'Девочка',
          age: 6,
          name: 'Молли',
          height: 24,
        },
      ],
    },
    {
      id: 'owner-2',
      fullName: 'Дмитрий Ким',
      email: 'dmitry@petty.ru',
      password: 'petty123',
      phone: '+7 999 444-55-66',
      city: 'Москва',
      pets: [
        {
          id: 'pet-3',
          family: 'Попугай',
          gender: 'Мальчик',
          age: 2,
          name: 'Клайд',
          height: 18,
        },
      ],
    },
  ],
  sitters: [
    {
      id: 'sitter-1',
      fullName: 'Мария Каренина',
      email: 'maria@petty.ru',
      password: 'petty123',
      phone: '+7 905 000-12-12',
      city: 'Санкт-Петербург',
      age: 28,
      rating: 4.9,
      about: '5 лет выгуливаю собак и умею работать с тревожными питомцами.',
    },
    {
      id: 'sitter-2',
      fullName: 'Игорь Сергеев',
      email: 'igor@petty.ru',
      password: 'petty123',
      phone: '+7 901 333-77-90',
      city: 'Москва',
      age: 32,
      rating: 4.6,
      about: 'Люблю котов и собак, есть опыт с животными, нуждающимися в лекарствах.',
    },
  ],
  orders: [
    {
      id: 'order-1',
      ownerId: 'owner-1',
      petId: 'pet-1',
      date: '2025-02-18',
      address: 'Санкт-Петербург, Невский проспект, 12',
      comment: 'Нужно погулять вечером и покормить. Роки знает основные команды.',
      status: 'open',
      applicants: ['sitter-1'],
      assignedSitterId: null,
      chat: [],
    },
    {
      id: 'order-2',
      ownerId: 'owner-2',
      petId: 'pet-3',
      date: '2025-02-22',
      address: 'Москва, ул. Маршала Бирюзова, 8',
      comment: 'Покормить дважды, обожает пообщаться. Вечером выключить лампу.',
      status: 'assigned',
      applicants: ['sitter-2'],
      assignedSitterId: 'sitter-2',
      chat: [
        {
          id: 'msg-1',
          senderRole: 'owner',
          senderId: 'owner-2',
          text: 'Здравствуйте! В субботу буду в отъезде, оставлю корм на кухне.',
          timestamp: Date.now() - 1000 * 60 * 60 * 12,
        },
        {
          id: 'msg-2',
          senderRole: 'sitter',
          senderId: 'sitter-2',
          text: 'Добрый день! Я буду к 10 утра. Есть ли любимые игрушки?',
          timestamp: Date.now() - 1000 * 60 * 60 * 6,
        },
      ],
    },
  ],
}

function loadState() {
  try {
    const raw = localStorage.getItem('petty_state')
    if (!raw) return defaultState
    const parsed = JSON.parse(raw)
    return { ...defaultState, ...parsed }
  } catch (error) {
    console.error('Не удалось загрузить состояние из localStorage', error)
    return defaultState
  }
}

const initialState = loadState()

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    login: (state, action) => {
      const { role, email, password } = action.payload
      const pool = role === 'owner' ? state.owners : state.sitters
      const found = pool.find(
        (item) => item.email === email.trim() && item.password === password,
      )

      if (found) {
        state.auth = { role, userId: found.id }
        state.authError = null
      } else {
        state.auth = { role: null, userId: null }
        state.authError = 'Неверный email или пароль'
      }
    },
    registerOwner: {
      prepare: (payload) => ({
        payload: {
          ...payload,
          id: `owner-${nanoid(6)}`,
        },
      }),
      reducer: (state, action) => {
        const owner = {
          ...action.payload,
          pets: [],
        }
        state.owners.push(owner)
        state.auth = { role: 'owner', userId: owner.id }
        state.authError = null
      },
    },
    registerSitter: {
      prepare: (payload) => ({
        payload: {
          ...payload,
          id: `sitter-${nanoid(6)}`,
        },
      }),
      reducer: (state, action) => {
        const sitter = {
          ...action.payload,
          rating: action.payload.rating || 4,
        }
        state.sitters.push(sitter)
        state.auth = { role: 'sitter', userId: sitter.id }
        state.authError = null
      },
    },
    logout: (state) => {
      state.auth = { role: null, userId: null }
    },
    addPet: {
      prepare: (payload) => ({
        payload: {
          ...payload,
          pet: {
            ...payload.pet,
            id: `pet-${nanoid(6)}`,
          },
        },
      }),
      reducer: (state, action) => {
        const owner = state.owners.find((o) => o.id === action.payload.ownerId)
        if (owner) {
          owner.pets.push(action.payload.pet)
        }
      },
    },
    createOrder: {
      prepare: (payload) => ({
        payload: {
          ...payload,
          id: `order-${nanoid(6)}`,
        },
      }),
      reducer: (state, action) => {
        const order = {
          id: action.payload.id,
          ownerId: action.payload.ownerId,
          petId: action.payload.petId,
          date: action.payload.date,
          address: action.payload.address,
          comment: action.payload.comment,
          status: 'open',
          applicants: [],
          assignedSitterId: null,
          chat: [],
        }
        state.orders.unshift(order)
      },
    },
    applyToOrder: (state, action) => {
      const { orderId, sitterId } = action.payload
      const order = state.orders.find((o) => o.id === orderId)
      if (order && order.status === 'open' && !order.applicants.includes(sitterId)) {
        order.applicants.push(sitterId)
      }
    },
    assignSitter: (state, action) => {
      const { orderId, sitterId } = action.payload
      const order = state.orders.find((o) => o.id === orderId)
      if (order) {
        order.assignedSitterId = sitterId
        order.status = 'assigned'
        if (!order.applicants.includes(sitterId)) {
          order.applicants.push(sitterId)
        }
      }
    },
    sendMessage: {
      prepare: (payload) => ({
        payload: {
          ...payload,
          id: `msg-${nanoid(6)}`,
          timestamp: Date.now(),
        },
      }),
      reducer: (state, action) => {
        const order = state.orders.find((o) => o.id === action.payload.orderId)
        if (order) {
          order.chat.push({
            id: action.payload.id,
            senderRole: action.payload.senderRole,
            senderId: action.payload.senderId,
            text: action.payload.text,
            timestamp: action.payload.timestamp,
          })
        }
      },
    },
  },
})

export const {
  login,
  registerOwner,
  registerSitter,
  logout,
  addPet,
  createOrder,
  applyToOrder,
  assignSitter,
  sendMessage,
} = appSlice.actions

const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
})

store.subscribe(() => {
  try {
    const state = store.getState().app
    localStorage.setItem(
      'petty_state',
      JSON.stringify({
        ...state,
        auth: { role: null, userId: null },
      }),
    )
  } catch (error) {
    console.error('Не удалось сохранить состояние', error)
  }
})

export default store
