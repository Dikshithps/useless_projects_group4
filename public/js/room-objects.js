// Room Objects Renderer and Animation Manager for POWER CUT
class RoomRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentObjects = [];
    this.onObjectClickCallback = null;
  }

  renderRoom(objects) {
    this.container.innerHTML = '';
    this.currentObjects = objects;

    objects.forEach(obj => {
      const el = document.createElement('div');
      el.className = `room-object ${obj.animated ? 'anim-' + obj.animated : ''}`;
      el.dataset.id = obj.id;
      el.dataset.name = obj.name;

      el.style.left = `${obj.x}%`;
      el.style.top = `${obj.y}%`;
      el.style.width = `${obj.w}%`;
      el.style.height = `${obj.h}%`;
      el.style.backgroundColor = obj.color || 'transparent';

      // Inner Icon & Text Label
      let innerHTML = `<div class="obj-icon">${obj.icon}</div>`;
      innerHTML += `<div class="obj-label">${obj.name}</div>`;

      // Special Animated Accents
      if (obj.id === 'wall_clock' || obj.id === 'clock') {
        innerHTML += `<div class="clock-hand"></div>`;
      } else if (obj.id === 'ceiling_fan' || obj.id === 'fan') {
        innerHTML += `<div class="fan-blades">🌀</div>`;
      } else if (obj.id === 'sleepy_cat') {
        innerHTML += `<div class="cat-eyes">👀</div>`;
      }

      el.innerHTML = innerHTML;

      // Object Click Handler
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onObjectClickCallback) {
          this.onObjectClickCallback(obj, e.clientX, e.clientY);
        }
      });

      this.container.appendChild(el);
    });
  }

  // Trigger ambient animations & funny distractor events during blackout
  triggerRandomEvent() {
    const events = ['cat_run', 'phone_vibrate', 'lamp_flicker', 'door_creak', 'clock_tick', 'cup_wobble'];
    const selected = events[Math.floor(Math.random() * events.length)];

    if (selected === 'cat_run') {
      const catEl = document.createElement('div');
      catEl.className = 'dark-cat-runner';
      catEl.innerHTML = '🐱 <span style="color:#fbbf24">👀</span>';
      this.container.appendChild(catEl);
      if (window.sounds) window.sounds.playMeow();
      setTimeout(() => catEl.remove(), 2500);

    } else if (selected === 'phone_vibrate') {
      const phoneEl = this.container.querySelector('[data-id="smartphone"]') || this.container.querySelector('[data-id="phone"]');
      if (phoneEl) {
        phoneEl.classList.add('anim-vibrate');
        if (window.sounds) window.sounds.playPhoneRing();
        setTimeout(() => phoneEl.classList.remove('anim-vibrate'), 1500);
      }

    } else if (selected === 'lamp_flicker') {
      const lampEl = this.container.querySelector('[data-id="floor_lamp"]') || this.container.querySelector('[data-id="table_lamp"]');
      if (lampEl) {
        lampEl.classList.add('anim-flicker');
        if (window.sounds) window.sounds.playSpark();
        setTimeout(() => lampEl.classList.remove('anim-flicker'), 800);
      }

    } else if (selected === 'door_creak') {
      const doorEl = this.container.querySelector('[data-id="room_door"]');
      if (doorEl) {
        doorEl.classList.add('anim-wobble');
        setTimeout(() => doorEl.classList.remove('anim-wobble'), 1200);
      }

    } else if (selected === 'cup_wobble') {
      const cupEl = this.container.querySelector('[data-id="white_cup"]') || this.container.querySelector('[data-id="toy_car"]');
      if (cupEl) {
        cupEl.classList.add('anim-wobble');
        setTimeout(() => cupEl.classList.remove('anim-wobble'), 1500);
      }

    } else if (selected === 'clock_tick') {
      if (window.sounds) window.sounds.playClockTick();
    }
  }
}
