document.addEventListener("DOMContentLoaded", () => {
  // Инициализация библиотек
  if (window.lucide) lucide.createIcons();
  if (window.AOS) AOS.init({ once: true, duration: 800 });

  const eventsData = [
    { id: 1, title: "Модель дипломатического саммита ЦА", date: "25 Августа, 16:00", type: "Онлайн / Zoom", xp: 150, category: "Международные Отношения" },
    { id: 2, title: "Воркшоп: Запуск Эко-стартапа с нуля", date: "28 Августа, 18:00", type: "Алматы / Офлайн", xp: 200, category: "Экология" },
    { id: 3, title: "Закрытый мастер-класс по Медиа и SMM", date: "2 Сентября, 17:00", type: "Онлайн / Zoom", xp: 100, category: "Медиа и PR" }
  ];

  const defaultUser = {
    name: "",
    email: "",
    country: "",
    department: "",
    xp: 100,
    level: 1,
    coins: 100,
    streak: 1,
    lastBonusDate: "",
    registeredEvents: []
  };

  function getUserData() {
    const data = localStorage.getItem("cayp_user_logged_in");
    return data ? JSON.parse(data) : null;
  }

  function saveUserData(data) {
    localStorage.setItem("cayp_user_logged_in", JSON.stringify(data));
    updateUI();
  }

  function addXP(amount) {
    let user = getUserData();
    if (!user) return;
    user.xp += amount;
    user.coins += Math.floor(amount / 2);

    const newLevel = Math.floor(user.xp / 300) + 1;
    if (newLevel > user.level) {
      user.level = newLevel;
      alert(`🎉 ПОЗДРАВЛЯЕМ! Вы достигли ${newLevel} уровня! Вам начислено +100 CA-Coins!`);
      user.coins += 100;
    }
    saveUserData(user);
  }

  function updateUI() {
    const user = getUserData();
    const authNavContainer = document.getElementById("authNavContainer");
    const dashboardSection = document.getElementById("dashboardSection");

    if (user) {
      if (dashboardSection) dashboardSection.classList.remove("hidden");
      if (authNavContainer) {
        authNavContainer.innerHTML = `
          <div class="flex items-center space-x-3 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span class="text-xs font-bold text-slate-800">👤 ${user.name}</span>
            <button id="logoutBtn" class="text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold px-2.5 py-1 rounded-lg transition-all">Выйти</button>
          </div>
        `;
        document.getElementById("logoutBtn").addEventListener("click", () => {
          localStorage.removeItem("cayp_user_logged_in");
          location.reload();
        });
      }

      document.getElementById("dashUserName").textContent = user.name;
      document.getElementById("dashUserDept").textContent = user.department;
      document.getElementById("dashUserCountry").textContent = user.country;
      document.getElementById("dashLevelBadge").textContent = `Уровень ${user.level}`;
      document.getElementById("dashStreak").textContent = `${user.streak} дн. подряд`;
      document.getElementById("dashCoins").textContent = `${user.coins} CC`;
      document.getElementById("dashXpText").textContent = `${user.xp} / ${user.level * 300} XP`;

      const xpProgress = ((user.xp % 300) / 300) * 100;
      document.getElementById("dashXpBar").style.width = `${Math.min(xpProgress, 100)}%`;

      renderChallenges(user);
    } else {
      if (dashboardSection) dashboardSection.classList.add("hidden");
      if (authNavContainer) {
        authNavContainer.innerHTML = `
          <button id="openAuthModalBtn" class="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-800 transition-all shadow-md active:scale-95">
              <i data-lucide="user" class="w-4 h-4 mr-1.5"></i> Войти / Регистрация
          </button>
        `;
        document.getElementById("openAuthModalBtn").addEventListener("click", openModal);
      }
    }

    renderEvents(user);
  }

  function renderEvents(user) {
    const eventsGrid = document.getElementById("eventsGrid");
    if (!eventsGrid) return;
    eventsGrid.innerHTML = "";

    eventsData.forEach(event => {
      const isRegistered = user && user.registeredEvents && user.registeredEvents.includes(event.id);

      const card = document.createElement("div");
      card.className = "p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:shadow-lg transition-all";
      card.innerHTML = `
        <div>
          <div class="flex justify-between items-center mb-3">
            <span class="text-[10px] font-bold bg-brand-100 text-brand-800 px-2.5 py-1 rounded-md uppercase">${event.category}</span>
            <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">+${event.xp} XP</span>
          </div>
          <h3 class="text-base font-bold text-slate-900 mb-2">${event.title}</h3>
          <p class="text-xs text-slate-500 mb-1">📅 ${event.date}</p>
          <p class="text-xs text-slate-500 mb-4">📍 ${event.type}</p>
        </div>
        <button 
          data-event-id="${event.id}"
          class="event-btn w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
            isRegistered 
              ? "bg-emerald-100 text-emerald-800 cursor-default" 
              : "bg-slate-900 hover:bg-slate-800 text-white"
          }"
          ${isRegistered ? "disabled" : ""}
        >
          ${isRegistered ? "✓ Вы зарегистрированы" : user ? "Зарегистрироваться" : "Войдите для записи"}
        </button>
      `;
      eventsGrid.appendChild(card);
    });

    document.querySelectorAll(".event-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.getAttribute("data-event-id"));
        registerForEvent(id);
      });
    });
  }

  function renderChallenges(user) {
    const container = document.getElementById("challengesContainer");
    if (!container) return;
    const challenges = [
      { title: "Заполнить профиль", reward: "100 XP", done: true },
      { title: "Записаться на 2 события", reward: "200 XP", done: user.registeredEvents.length >= 2 },
      { title: "Заходить 3 дня подряд", reward: "150 XP", done: user.streak >= 3 }
    ];

    container.innerHTML = challenges.map(c => `
      <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-between">
        <div>
          <div class="text-xs font-bold text-white">${c.title}</div>
          <div class="text-[10px] text-amber-400 font-bold">Награда: ${c.reward}</div>
        </div>
        <span class="text-xs font-bold ${c.done ? 'text-emerald-400' : 'text-slate-500'}">
          ${c.done ? '✓ Выполнено' : 'В процессе'}
        </span>
      </div>
    `).join("");
  }

  function registerForEvent(eventId) {
    let user = getUserData();
    if (!user) {
      openModal();
      return;
    }

    if (!user.registeredEvents.includes(eventId)) {
      const event = eventsData.find(e => e.id === eventId);
      user.registeredEvents.push(eventId);
      saveUserData(user);
      addXP(event.xp);
      alert(`Успех! Вы зарегистрированы на «${event.title}». Вам начислено +${event.xp} XP!`);
    }
  }

  const dailyRewardBtn = document.getElementById("dailyRewardBtn");
  if (dailyRewardBtn) {
    dailyRewardBtn.addEventListener("click", () => {
      let user = getUserData();
      if (!user) return;

      const today = new Date().toDateString();
      if (user.lastBonusDate === today) {
        alert("Вы уже забирали сегодняшний бонус! Возвращайтесь завтра.");
      } else {
        user.lastBonusDate = today;
        user.streak += 1;
        saveUserData(user);
        addXP(50);
        alert("🎁 Вы получили ежедневный бонус: +50 XP и +1 к стрику!");
      }
    });
  }

  // ОБРАБОТЧИК ЧАТА
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const chatMessages = document.getElementById("chatMessages");

  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = userInput.value.trim();
      if (!text) return;

      // Сообщение пользователя
      const userMsg = document.createElement("div");
      userMsg.className = "bg-brand-600 text-white p-3 rounded-2xl shadow-sm max-w-[85%] ml-auto text-sm";
      userMsg.textContent = text;
      chatMessages.appendChild(userMsg);

      userInput.value = "";
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Ответ бота
      setTimeout(() => {
        const botMsg = document.createElement("div");
        botMsg.className = "bg-white border border-slate-200 p-3 rounded-2xl shadow-sm max-w-[85%] text-slate-800 text-sm";
        botMsg.textContent = "Спасибо за вопрос! Наш менеджер скоро ответит вам или ознакомьтесь с разделами выше.";
        chatMessages.appendChild(botMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 600);
    });
  }

  // МОДАЛЬНОЕ ОКНО
  const authModal = document.getElementById("authModal");

  function openModal() {
    if (!authModal) return;
    authModal.classList.remove("pointer-events-none", "opacity-0");
    authModal.classList.add("opacity-100");
  }

  function closeModal() {
    if (!authModal) return;
    authModal.classList.remove("opacity-100");
    authModal.classList.add("opacity-0", "pointer-events-none");
  }

  const closeBtn = document.getElementById("closeAuthModalBtn");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  const regForm = document.getElementById("registerForm");
  if (regForm) {
    regForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const newUser = {
        ...defaultUser,
        name: document.getElementById("regName").value,
        email: document.getElementById("regEmail").value,
        country: document.getElementById("regCountry").value,
        department: document.getElementById("regDepartment").value,
        lastBonusDate: new Date().toDateString()
      };

      saveUserData(newUser);
      closeModal();
      alert("Вы успешно вошли в личный кабинет! Начислено +100 XP.");
    });
  }

  // АНИМАЦИЯ ТЕКСТА
  const typewriterElement = document.getElementById("typewriterText");
  if (typewriterElement) {
    const titlePhrases = ["Youth Parliament", "Diplomacy Forum", "Leadership Hub"];
    let phraseIndex = 0, charIndex = 0, isDeleting = false;

    function typeEffect() {
      const currentPhrase = titlePhrases[phraseIndex];
      typewriterElement.textContent = isDeleting 
        ? currentPhrase.substring(0, charIndex - 1) 
        : currentPhrase.substring(0, charIndex + 1);

      charIndex += isDeleting ? -1 : 1;
      let speed = isDeleting ? 50 : 100;

      if (!isDeleting && charIndex === currentPhrase.length) {
        speed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % titlePhrases.length;
        speed = 500;
      }

      setTimeout(typeEffect, speed);
    }
    typeEffect();
  }

  updateUI();
});