/* SmartResources Hub — Front-end interactions */

(() => {
  'use strict';

  const STORE = {
    users: 'srhUsers',
    current: 'srhCurrentUser',
    profiles: 'srhProfiles',
    saved: 'srhSavedResourcesByUser'
  };

  // Local storage helpers
  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const slug = value =>
    (value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const currentUser = () => read(STORE.current, null);

  const userKey = user =>
    user?.email ? user.email.trim().toLowerCase() : null;

  const getProfile = user => {
    const key = userKey(user);
    if (!key) return null;

    return read(STORE.profiles, {})[key] || null;
  };

  const setProfile = (user, profile) => {
    const key = userKey(user);
    if (!key) return;

    const profiles = read(STORE.profiles, {});
    profiles[key] = profile;
    write(STORE.profiles, profiles);
  };

  const getSaved = user => {
    const key = userKey(user);
    return key ? (read(STORE.saved, {})[key] || []) : [];
  };

  const setSaved = (user, items) => {
    const key = userKey(user);
    if (!key) return;

    const all = read(STORE.saved, {});
    all[key] = items;
    write(STORE.saved, all);
  };

  // Login and signup panel switching
  window.showLogin = () => {
    const login = document.getElementById('loginPanel');
    const signup = document.getElementById('signupPanel');

    if (login && signup) {
      login.hidden = false;
      login.style.display = '';
      signup.hidden = true;
      signup.style.display = 'none';
    }
  };

  window.showSignup = () => {
    const login = document.getElementById('loginPanel');
    const signup = document.getElementById('signupPanel');

    if (login && signup) {
      login.hidden = true;
      login.style.display = 'none';
      signup.hidden = false;
      signup.style.display = '';
    }
  };

  document.addEventListener('DOMContentLoaded', () => {

    const page = location.pathname.split('/').pop() || 'index.html';

    const privatePages = [
      'dashboard.html',
      'recommendations.html',
      'saved-items.html',
      'my-profile.html',
      'profile-setup.html'
    ];

    let user = currentUser();

    if (privatePages.includes(page) && !user) {
      location.replace('auth.html');
      return;
    }

    // Logout
    document.querySelectorAll('a').forEach(link => {
      if (link.textContent.trim().toLowerCase() === 'logout') {
        link.addEventListener('click', event => {
          event.preventDefault();
          localStorage.removeItem(STORE.current);
          location.href = 'index.html';
        });
      }
    });

    // Password visibility
    document.querySelectorAll('[data-toggle-password]').forEach(button => {
      button.addEventListener('click', () => {
        const input = document.querySelector(button.dataset.togglePassword);
        if (!input) return;

        input.type =
          input.type === 'password' ? 'text' : 'password';

        button.setAttribute(
          'aria-label',
          input.type === 'password' ? 'Show password' : 'Hide password'
        );
      });
    });

    // Signup
    const signup = document.getElementById('signupForm');

    if (signup) {
      signup.addEventListener('submit', event => {
        event.preventDefault();

        if (!signup.reportValidity()) return;

        const name = signup.querySelector('#signupName').value.trim();
        const email = signup.querySelector('#signupEmail').value.trim().toLowerCase();
        const password = signup.querySelector('#signupPassword').value;

        const users = read(STORE.users, []);

        if (users.some(existing => existing.email === email)) {
          alert('An account with this email already exists. Please log in.');
          window.showLogin();
          return;
        }

        users.push({
          name,
          email,
          password,
          createdAt: new Date().toISOString()
        });

        write(STORE.users, users);

        user = { name, email };
        write(STORE.current, user);

        location.href = 'profile-setup.html';
      });
    }

    // Login
    const login = document.getElementById('loginForm');

    if (login) {
      login.addEventListener('submit', event => {
        event.preventDefault();

        if (!login.reportValidity()) return;

        const email = login.querySelector('#loginEmail').value.trim().toLowerCase();
        const password = login.querySelector('#loginPassword').value;

        const account = read(STORE.users, []).find(
          item => item.email === email && item.password === password
        );

        if (!account) {
          alert('Email or password is incorrect. If you are new, please create an account first.');
          return;
        }

        user = {
          name: account.name,
          email: account.email
        };

        write(STORE.current, user);

        location.href = getProfile(user)
          ? 'dashboard.html'
          : 'profile-setup.html';
      });
    }

    // Profile setup wizard
    const profileForm = document.querySelector('[data-step-form]');

    if (profileForm) {
      const panels = [
        ...profileForm.querySelectorAll('[data-step-panel]')
      ];

      const stepIndicators = [
        ...document.querySelectorAll('.steps .step')
      ];

      let activeStep = 0;

      const showStep = index => {
        activeStep = index;

        panels.forEach((panel, i) => {
          panel.hidden = i !== index;
          panel.style.display = i === index ? 'block' : 'none';
        });

        stepIndicators.forEach((step, i) => {
          step.classList.toggle('current', i === index);
          step.classList.toggle('done', i < index);
        });

        const counter = document.querySelector('[data-step-counter]');

        if (counter) {
          counter.textContent = String(index + 1);
        }
      };

      const existing = getProfile(user);

      const fields = [
        'eduLevel',
        'fieldOfStudy',
        'yearOfStudy',
        'category',
        'state',
        'fullName',
        'dob',
        'phone'
      ];

      if (existing) {
        fields.forEach(id => {
          const field = document.getElementById(id);

          if (field && existing[id] != null) {
            field.value = existing[id];
          }
        });
      }

      if (existing?.interests) {
        profileForm.querySelectorAll('input[type="checkbox"]').forEach(box => {
          const label = box.parentElement.textContent.trim();
          box.checked = existing.interests.includes(label);
        });
      }

      const fullName = document.getElementById('fullName');

      if (fullName && !fullName.value && user?.name) {
        fullName.value = user.name;
      }

      profileForm.querySelectorAll('[data-next]').forEach(button => {
        button.addEventListener('click', () => {
          const required =
            panels[activeStep]?.querySelectorAll(
              'input[required], select[required]'
            ) || [];

          for (const field of required) {
            if (!field.checkValidity()) {
              field.reportValidity();
              return;
            }
          }

          if (activeStep < panels.length - 1) {
            showStep(activeStep + 1);
          }
        });
      });

      profileForm.querySelectorAll('[data-prev]').forEach(button => {
        button.addEventListener('click', () => {
          if (activeStep > 0) {
            showStep(activeStep - 1);
          }
        });
      });

      profileForm.addEventListener('submit', event => {
        event.preventDefault();

        const missing = [
          ...profileForm.querySelectorAll(
            'input[required], select[required]'
          )
        ].find(field => !field.checkValidity());

        if (missing) {
          const panelIndex = panels.findIndex(panel =>
            panel.contains(missing)
          );

          if (panelIndex >= 0) {
            showStep(panelIndex);
          }

          missing.reportValidity();
          return;
        }

        const profile = {};

        fields.forEach(id => {
          const field = document.getElementById(id);

          if (field) {
            profile[id] = field.value.trim();
          }
        });

        profile.interests = [
          ...profileForm.querySelectorAll(
            'input[type="checkbox"]:checked'
          )
        ].map(box => box.parentElement.textContent.trim());

        profile.updatedAt = new Date().toISOString();

        setProfile(user, profile);

        if (profile.fullName && user) {
          const accounts = read(STORE.users, []);

          const account = accounts.find(
            item => item.email === user.email
          );

          if (account) {
            account.name = profile.fullName;
            write(STORE.users, accounts);
          }

          user.name = profile.fullName;
          write(STORE.current, user);
        }

        location.href = 'dashboard.html';
      });

      showStep(0);
    }

    // Update save button labels
    function syncSaveButtons() {
      document.querySelectorAll('[data-save-btn]').forEach(button => {
        const card =
          button.closest('[data-resource-id]') ||
          button.closest('.resource-card');

        if (!card) return;

        const id = card.dataset.resourceId;
        const label = button.querySelector('span');

        const active = getSaved(user).some(item => item.id === id);

        if (label) {
          label.textContent = active ? 'Saved' : 'Save';
        }

        button.setAttribute('aria-pressed', String(active));
      });
    }

    // Save and unsave resources using event delegation
    document.addEventListener('click', event => {
      const button = event.target.closest('[data-save-btn]');

      if (!button) return;

      if (!user) {
        alert('Please log in to save resources.');
        location.href = 'auth.html';
        return;
      }

      const card =
        button.closest('[data-resource-id]') ||
        button.closest('.resource-card');

      if (!card) return;

      if (!card.dataset.resourceId) {
        card.dataset.resourceId = slug(
          card.querySelector('h3')?.textContent || 'resource'
        );
      }

      const id = card.dataset.resourceId;
      const items = getSaved(user);

      const existing = items.find(item => item.id === id);

      let updatedItems;

      if (existing) {
        updatedItems = items.filter(item => item.id !== id);
      } else {
        const officialLink = card.querySelector(
          '[data-official-link]'
        );

        const ordinaryLink = card.querySelector(
          'a[href^="http"]'
        );

        const link = officialLink || ordinaryLink;

        updatedItems = [
          ...items,
          {
            id,
            title: card.querySelector('h3')?.textContent.trim() || 'Resource',
            category: card.dataset.category || 'other',
            description:
              card.querySelector('.desc')?.textContent.trim() || '',
            applyUrl: link?.href || '',
            savedAt: new Date().toISOString()
          }
        ];
      }

      setSaved(user, updatedItems);
      syncSaveButtons();
    });

    syncSaveButtons();

    // Saved resources page
    const savedGrid = document.getElementById('savedGrid');
    const emptyState = document.getElementById('savedEmptyState');

    if (savedGrid) {
      const items = getSaved(user);

      items.forEach(item => {
        if (
          savedGrid.querySelector(
            `[data-resource-id="${CSS.escape(item.id)}"]`
          )
        ) {
          return;
        }

        const article = document.createElement('article');

        article.className = 'resource-card saved-card';
        article.dataset.savedCard = '';
        article.dataset.category = item.category || 'other';
        article.dataset.resourceId = item.id;

        const top = document.createElement('div');
        top.className = 'resource-card-top';

        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = 'Saved resource';

        top.appendChild(badge);

        const heading = document.createElement('h3');
        heading.textContent = item.title;

        const description = document.createElement('p');
        description.className = 'desc';
        description.textContent = item.description || '';

        const actions = document.createElement('div');
        actions.style.cssText =
          'display:flex;gap:10px;margin-top:6px;';

        if (item.applyUrl) {
          const officialLink = document.createElement('a');

          officialLink.className = 'btn btn-outline';
          officialLink.href = item.applyUrl;
          officialLink.target = '_blank';
          officialLink.rel = 'noopener noreferrer';
          officialLink.textContent = 'Official Website';

          actions.appendChild(officialLink);
        }

        const removeButton = document.createElement('button');

        removeButton.type = 'button';
        removeButton.className = 'btn btn-primary';
        removeButton.dataset.removeBtn = '';
        removeButton.textContent = 'Remove';

        actions.appendChild(removeButton);

        article.append(top, heading, description, actions);

        savedGrid.appendChild(article);
      });

      savedGrid.addEventListener('click', event => {
        const button = event.target.closest('[data-remove-btn]');

        if (!button) return;

        const card = button.closest('[data-saved-card]');

        if (!card) return;

        const updatedItems = getSaved(user).filter(
          item => item.id !== card.dataset.resourceId
        );

        setSaved(user, updatedItems);

        card.remove();

        if (!savedGrid.querySelector('[data-saved-card]')) {
          savedGrid.hidden = true;

          if (emptyState) {
            emptyState.hidden = false;
          }
        }
      });

      if (!savedGrid.querySelector('[data-saved-card]')) {
        savedGrid.hidden = true;

        if (emptyState) {
          emptyState.hidden = false;
        }
      }
    }

    // Personalize account information
    if (user) {
      const profile = getProfile(user) || {};

      document.querySelectorAll('[data-user-name]').forEach(element => {
        element.textContent =
          profile.fullName || user.name || 'Student';
      });

      document.querySelectorAll('[data-user-email]').forEach(element => {
        element.textContent = user.email;
      });

      document.querySelectorAll('[data-user-initial]').forEach(element => {
        element.textContent = (
          profile.fullName || user.name || 'S'
        ).charAt(0).toUpperCase();
      });

      const profilePage = document.querySelector(
        '[data-profile-container]'
      );

      if (profilePage) {
        const set = (selector, value, fallback = 'Not added yet') => {
          const element = profilePage.querySelector(selector);

          if (element) {
            element.textContent = value || fallback;
          }
        };

        set('[data-profile-name]', profile.fullName || user.name);
        set('[data-profile-email]', user.email);
        set('[data-profile-education]', profile.eduLevel);
        set('[data-profile-field]', profile.fieldOfStudy);
        set('[data-profile-year]', profile.yearOfStudy);
        set('[data-profile-state]', profile.state);

        const interests = profilePage.querySelector(
          '[data-profile-interests]'
        );

        if (interests) {
          interests.replaceChildren();

          (profile.interests || []).forEach(value => {
            const pill = document.createElement('span');

            pill.className = 'pill active';
            pill.textContent = value;

            interests.appendChild(pill);
          });

          if (!profile.interests?.length) {
            interests.textContent = 'No interests selected yet.';
          }
        }
      }
    }

    // Recommendation search, filters and sorting
    const grid = document.getElementById('cardsGrid');

    if (grid) {
      const search = document.getElementById('resourceSearchInput');
      const sort = document.getElementById('sortBy');

      const pills = [
        ...document.querySelectorAll(
          '[data-filter-group] [data-category]'
        )
      ];

      let category =
        new URLSearchParams(location.search).get('category') || 'all';

      if (search) {
        search.value =
          new URLSearchParams(location.search).get('q') || '';

        search.addEventListener('input', applyFilters);
      }

      function applyFilters() {
        const query = (search?.value || '').toLowerCase().trim();

        const cards = [
          ...document.querySelectorAll('.rec-card')
        ];

        cards.forEach(card => {
          const cardCategory = card.dataset.category || 'other';

          const categoryMatch =
            category === 'all' ||
            cardCategory === category;

          const searchMatch =
            !query ||
            card.textContent.toLowerCase().includes(query);

          card.hidden = !(categoryMatch && searchMatch);
        });
      }

      pills.forEach(pill => {
        pill.classList.toggle(
          'active',
          pill.dataset.category === category
        );

        pill.addEventListener('click', () => {
          category = pill.dataset.category;

          pills.forEach(item => {
            item.classList.toggle('active', item === pill);
          });

          applyFilters();
        });
      });

      if (sort) {
        sort.addEventListener('change', () => {
          const cards = [
            ...grid.querySelectorAll('.rec-card')
          ];

          cards.sort((a, b) => {
            const first =
              a.querySelector('h3')?.textContent.trim() || '';

            const second =
              b.querySelector('h3')?.textContent.trim() || '';

            if (sort.value === 'za') {
              return second.localeCompare(first);
            }

            if (sort.value === 'az') {
              return first.localeCompare(second);
            }

            return 0;
          });

          cards.forEach(card => grid.appendChild(card));
        });
      }

      applyFilters();

      window.applyResourceFilters = applyFilters;
    }

    // Detail page tabs
    document.querySelectorAll(
      '[data-tabs="detail"] [data-tab]'
    ).forEach(tab => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.tab;

        document.querySelectorAll(
          '[data-tabs="detail"] [data-tab]'
        ).forEach(item => {
          item.classList.toggle('active', item === tab);
        });

        document.querySelectorAll(
          '[data-tab-panel-group="detail"] [data-tab-panel]'
        ).forEach(panel => {
          panel.hidden = panel.dataset.tabPanel !== key;
        });
      });
    });

    // XML catalog loader
    const catalog = document.querySelector('[data-xml-catalog]');

    if (catalog) {
      fetch('resources.xml')
        .then(response => {
          if (!response.ok) {
            throw new Error('Could not load resources.xml');
          }

          return response.text();
        })
        .then(xmlText => {
          const doc = new DOMParser().parseFromString(
            xmlText,
            'application/xml'
          );

          if (doc.querySelector('parsererror')) {
            throw new Error('Invalid XML catalog');
          }

          const xmlItems = doc.querySelectorAll('resources > item');

          xmlItems.forEach(item => {
            const get = name =>
              item.querySelector(name)?.textContent.trim() || '';

            const name = get('name');
            const benefit = get('benefit');
            const applyUrl = get('applyUrl');

            const id =
              item.getAttribute('id') || slug(name);

            // Avoid duplicate cards
            if (
              document.querySelector(
                `[data-resource-id="${CSS.escape(id)}"]`
              )
            ) {
              return;
            }

            const article = document.createElement('article');

            article.className = 'resource-card rec-card';
            article.dataset.resourceId = id;

            // Category mapping
            const rawCategory = get('category').toLowerCase();

            if (
              rawCategory.includes('government') ||
              rawCategory.includes('scheme')
            ) {
              article.dataset.category = 'government-scheme';
            } else if (
              rawCategory.includes('scholarship')
            ) {
              article.dataset.category = 'scholarship';
            } else if (
              rawCategory.includes('discount')
            ) {
              article.dataset.category = 'student-discount';
            } else if (
              rawCategory.includes('ai') ||
              rawCategory.includes('tech')
            ) {
              article.dataset.category = 'ai-tool';
            } else if (
              rawCategory.includes('internship')
            ) {
              article.dataset.category = 'internship';
            } else {
              article.dataset.category = slug(rawCategory);
            }

            // Resource title
            const heading = document.createElement('h3');
            heading.textContent = name;

            // Resource description
            const description = document.createElement('p');
            description.className = 'desc';
            description.textContent = benefit;

            // Scope and status
            const scope = document.createElement('p');
            scope.className = 'muted';
            scope.textContent =
              `${get('scope')} · ${get('status')}`;

            // Buttons
            const actions = document.createElement('div');

            actions.style.cssText =
              'display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;';

            // Direct official website link
            if (applyUrl) {
              const officialLink = document.createElement('a');

              officialLink.className = 'btn btn-outline';
              officialLink.href = applyUrl;
              officialLink.target = '_blank';
              officialLink.rel = 'noopener noreferrer';
              officialLink.dataset.officialLink = '';
              officialLink.textContent = 'Official Website';

              actions.appendChild(officialLink);
            }

            // Save button
            const saveButton = document.createElement('button');

            saveButton.type = 'button';
            saveButton.className = 'btn btn-primary';
            saveButton.dataset.saveBtn = '';
            saveButton.setAttribute('aria-pressed', 'false');

            const saveLabel = document.createElement('span');
            saveLabel.textContent = 'Save';

            saveButton.appendChild(saveLabel);

            actions.appendChild(saveButton);

            article.append(
              heading,
              description,
              scope,
              actions
            );

            catalog.appendChild(article);
          });

          // Update search results and saved button labels
          syncSaveButtons();

          if (window.applyResourceFilters) {
            window.applyResourceFilters();
          }
        })
        .catch(error => {
          catalog.textContent =
            'The resource catalog could not be loaded. Please check resources.xml and run this site using Live Server.';

          console.error('XML Catalog Error:', error);
        });
    }

  });

})();