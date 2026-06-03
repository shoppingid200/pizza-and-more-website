// audio.js
// Synthetic sound generation using Web Audio API

(function() {
  let audioCtx = null;
  let isMuted = false;

  // Admin ringing state
  let adminRingInterval = null;
  let isAdminRinging = false;

  // Delivery ping state
  let deliveryPingInterval = null;
  let isDeliveryPinging = false;
  let deliveryPingTimeout = null;

  function initAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return;
      }
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  // Attempt to unlock audio context on first user interaction
  const unlockAudio = () => {
    initAudio();
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  };
  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);

  function toggleMute() {
    isMuted = !isMuted;
    if (isMuted) {
      stopAdminRing();
      stopDeliveryPing();
    }
    return isMuted;
  }

  function getMuteState() {
    return isMuted;
  }

  function playTone(freq1, freq2, duration, type = "sine") {
    if (isMuted) return;
    initAudio();
    
    // Prevent queuing up sounds if the browser is blocking autoplay
    if (!audioCtx || audioCtx.state === 'suspended') return;
    
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = type;
    osc2.type = type;
    osc1.frequency.setValueAtTime(freq1, audioCtx.currentTime);
    if (freq2) osc2.frequency.setValueAtTime(freq2, audioCtx.currentTime);

    // Soft attack and decay
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

    osc1.connect(gainNode);
    if (freq2) osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start();
    if (freq2) osc2.start();
    osc1.stop(audioCtx.currentTime + duration);
    if (freq2) osc2.stop(audioCtx.currentTime + duration);
  }

  // Admin Ring: A harsh double-frequency telephone ring
  function triggerAdminRing() {
    // Ring for 1s
    playTone(440, 480, 1.0, "square");
  }

  function playAdminRing() {
    if (isMuted || isAdminRinging) return;
    isAdminRinging = true;
    triggerAdminRing(); // play immediately
    adminRingInterval = setInterval(() => {
      triggerAdminRing();
    }, 2500); // 1s ring, 1.5s pause
  }

  function stopAdminRing() {
    isAdminRinging = false;
    if (adminRingInterval) {
      clearInterval(adminRingInterval);
      adminRingInterval = null;
    }
  }

  // Delivery Ping: A quick double-sonar ping
  function triggerDeliveryPing() {
    playTone(880, null, 0.2, "sine");
    setTimeout(() => playTone(880, null, 0.2, "sine"), 300);
  }

  function playDeliveryPing(durationMs = null) {
    if (isMuted) {
      stopDeliveryPing();
      return;
    }
    
    if (isDeliveryPinging) {
      if (!durationMs && deliveryPingTimeout) {
        clearTimeout(deliveryPingTimeout);
        deliveryPingTimeout = null;
      }
      return;
    }
    
    isDeliveryPinging = true;
    triggerDeliveryPing();
    deliveryPingInterval = setInterval(() => {
      triggerDeliveryPing();
    }, 2000); // ping every 2s

    if (durationMs) {
      if (deliveryPingTimeout) clearTimeout(deliveryPingTimeout);
      deliveryPingTimeout = setTimeout(() => {
        stopDeliveryPing();
      }, durationMs);
    } else {
      if (deliveryPingTimeout) {
        clearTimeout(deliveryPingTimeout);
        deliveryPingTimeout = null;
      }
    }
  }

  function stopDeliveryPing() {
    isDeliveryPinging = false;
    if (deliveryPingInterval) {
      clearInterval(deliveryPingInterval);
      deliveryPingInterval = null;
    }
    if (deliveryPingTimeout) {
      clearTimeout(deliveryPingTimeout);
      deliveryPingTimeout = null;
    }
  }

  window.AudioEngine = {
    playAdminRing,
    stopAdminRing,
    playDeliveryPing,
    stopDeliveryPing,
    toggleMute,
    getMuteState
  };
})();
