import { escapeHtml } from '../utils.js';

    class CustomMultiSelect {
        constructor(elementId, placeholderText = 'Benutzer auswählen...') {
            this.container = document.getElementById(elementId);
            this.trigger = this.container.querySelector('.multiselect-trigger');
            this.placeholder = this.trigger.querySelector('.multiselect-placeholder');
            this.dropdown = this.container.querySelector('.multiselect-dropdown');
            this.searchInput = this.container.querySelector('.multiselect-search');
            this.optionsContainer = this.container.querySelector('.multiselect-options');
            this.placeholderText = placeholderText;
            this.users = []; // {id, username}
            this.selectedIds = new Set();
            this.disabled = false;
            
            this.initEvents();
        }
        
        setUsers(users) {
            this.users = users;
            this.renderOptions();
        }

        setDisabled(disabled) {
            this.disabled = !!disabled;
            if (this.disabled) {
                this.container.classList.add('disabled');
                this.closeDropdown();
            } else {
                this.container.classList.remove('disabled');
            }
            this.updateTrigger();
        }
        
        initEvents() {
            this.trigger.addEventListener('click', (e) => {
                if (this.disabled) return;
                e.stopPropagation();
                this.toggleDropdown();
            });
            
            this.searchInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            this.searchInput.addEventListener('input', () => {
                this.filterOptions();
            });
            
            document.addEventListener('click', () => {
                this.closeDropdown();
            });
        }
        
        toggleDropdown() {
            document.querySelectorAll('.custom-multiselect').forEach(el => {
                if (el !== this.container) {
                    el.classList.remove('active');
                }
            });
            this.container.classList.toggle('active');
            if (this.container.classList.contains('active')) {
                this.searchInput.focus();
                this.searchInput.value = '';
                this.filterOptions();
            }
        }
        
        closeDropdown() {
            this.container.classList.remove('active');
        }
        
        renderOptions() {
            this.optionsContainer.innerHTML = '';
            this.users.forEach(user => {
                const option = document.createElement('div');
                option.className = 'multiselect-option';
                option.dataset.id = user.id;
                if (this.selectedIds.has(user.id)) {
                    option.classList.add('selected');
                }
                
                option.innerHTML = `
                    <div class="multiselect-option-checkbox"></div>
                    <div class="multiselect-option-text">${escapeHtml(user.username)}</div>
                `;
                
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleOption(user.id, option);
                });
                
                this.optionsContainer.appendChild(option);
            });
            
            this.updateTrigger();
        }
        
        toggleOption(id, optionElement) {
            if (this.disabled) return;
            if (this.selectedIds.has(id)) {
                this.selectedIds.delete(id);
                optionElement.classList.remove('selected');
            } else {
                this.selectedIds.add(id);
                optionElement.classList.add('selected');
            }
            this.updateTrigger();
            this.triggerEvent();
        }
        
        getSelected() {
            return Array.from(this.selectedIds);
        }
        
        setSelected(ids) {
            this.selectedIds = new Set(ids.map(Number));
            this.updateOptionsUI();
            this.updateTrigger();
            this.searchInput.value = '';
            this.filterOptions();
        }
        
        clear() {
            this.selectedIds.clear();
            this.updateOptionsUI();
            this.updateTrigger();
            this.searchInput.value = '';
            this.filterOptions();
        }
        
        updateOptionsUI() {
            const options = this.optionsContainer.querySelectorAll('.multiselect-option:not(.no-results)');
            options.forEach(opt => {
                const id = Number(opt.dataset.id);
                if (this.selectedIds.has(id)) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
        }
        
        updateTrigger() {
            const existingTags = this.trigger.querySelector('.multiselect-tags');
            if (existingTags) {
                existingTags.remove();
            }
            
            if (this.selectedIds.size === 0) {
                this.placeholder.classList.remove('hidden');
                this.placeholder.textContent = this.placeholderText;
            } else {
                this.placeholder.classList.add('hidden');
                const tagsContainer = document.createElement('div');
                tagsContainer.className = 'multiselect-tags';
                
                this.users.forEach(user => {
                    if (this.selectedIds.has(user.id)) {
                        const tag = document.createElement('span');
                        tag.className = 'multiselect-tag';
                        tag.textContent = user.username;
                        
                        if (!this.disabled) {
                            const removeBtn = document.createElement('span');
                            removeBtn.className = 'multiselect-tag-remove';
                            removeBtn.innerHTML = '&times;';
                            removeBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                this.selectedIds.delete(user.id);
                                this.updateOptionsUI();
                                this.updateTrigger();
                                this.triggerEvent();
                            });
                            tag.appendChild(removeBtn);
                        }
                        
                        tagsContainer.appendChild(tag);
                    }
                });
                
                this.trigger.insertBefore(tagsContainer, this.trigger.querySelector('.multiselect-arrow'));
            }
        }
        
        filterOptions() {
            const query = this.searchInput.value.toLowerCase().trim();
            const options = this.optionsContainer.querySelectorAll('.multiselect-option:not(.no-results)');
            let visibleCount = 0;
            options.forEach(opt => {
                const username = opt.querySelector('.multiselect-option-text').textContent.toLowerCase();
                if (username.includes(query)) {
                    opt.classList.remove('hidden');
                    visibleCount++;
                } else {
                    opt.classList.add('hidden');
                }
            });
            
            let noResults = this.optionsContainer.querySelector('.no-results');
            if (visibleCount === 0) {
                if (!noResults) {
                    noResults = document.createElement('div');
                    noResults.className = 'multiselect-option no-results';
                    noResults.style.color = 'var(--text-secondary)';
                    noResults.style.cursor = 'default';
                    noResults.style.justifyContent = 'center';
                    noResults.textContent = 'Keine Benutzer gefunden';
                    this.optionsContainer.appendChild(noResults);
                }
                noResults.classList.remove('hidden');
            } else if (noResults) {
                noResults.classList.add('hidden');
            }
        }
        
        triggerEvent() {
            const event = new CustomEvent('change', { detail: this.getSelected() });
            this.container.dispatchEvent(event);
        }
    }

export { CustomMultiSelect };
