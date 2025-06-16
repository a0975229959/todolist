class TodoApp {
  constructor() {
    this.todos = [];
    this.filteredTodos = [];
    this.currentFilter = "all";
    this.currentPage = 1;
    this.todosPerPage = 12;
    this.searchTerm = "";

    this.init();
  }

  async init() {
    await this.fetchTodos();
    this.bindEvents();
    this.render();
  }

  async fetchTodos() {
    try {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/todos"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.todos = await response.json();
      this.filteredTodos = [...this.todos];
      this.updateStats();
    } catch (error) {
      this.showError("無法載入待辦事項資料", error.message);
    }
  }

  bindEvents() {
    // 搜尋功能
    document.getElementById("searchInput").addEventListener("input", (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.applyFilters();
    });

    // 篩選按鈕
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        this.currentFilter = e.target.dataset.filter;
        this.currentPage = 1;
        this.applyFilters();
      });
    });

    // 分頁按鈕
    document.getElementById("prevBtn").addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.render();
      }
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
      const totalPages = Math.ceil(
        this.filteredTodos.length / this.todosPerPage
      );
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.render();
      }
    });
  }

  applyFilters() {
    this.filteredTodos = this.todos.filter((todo) => {
      // 搜尋篩選
      const matchesSearch = todo.title.toLowerCase().includes(this.searchTerm);

      // 狀態篩選
      let matchesFilter = true;
      if (this.currentFilter === "completed") {
        matchesFilter = todo.completed;
      } else if (this.currentFilter === "pending") {
        matchesFilter = !todo.completed;
      }

      return matchesSearch && matchesFilter;
    });

    this.currentPage = 1;
    this.render();
  }

  updateStats() {
    const total = this.todos.length;
    const completed = this.todos.filter((todo) => todo.completed).length;
    const pending = total - completed;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("completedCount").textContent = completed;
    document.getElementById("pendingCount").textContent = pending;
  }

  render() {
    const content = document.getElementById("content");
    const startIndex = (this.currentPage - 1) * this.todosPerPage;
    const endIndex = startIndex + this.todosPerPage;
    const todosToShow = this.filteredTodos.slice(startIndex, endIndex);

    if (this.filteredTodos.length === 0) {
      content.innerHTML = `
                        <div class="error">
                            <div class="error-icon">😔</div>
                            <h3>找不到符合條件的待辦事項</h3>
                            <p>試試調整搜尋條件或篩選設定</p>
                        </div>
                    `;
      document.getElementById("pagination").style.display = "none";
      return;
    }

    content.innerHTML = `
                    <div class="todos-grid">
                        ${todosToShow
                          .map((todo) => this.createTodoCard(todo))
                          .join("")}
                    </div>
                `;

    this.renderPagination();
  }

  createTodoCard(todo) {
    const statusClass = todo.completed ? "completed" : "pending";
    const statusText = todo.completed ? "已完成" : "待完成";
    const statusBadgeClass = todo.completed
      ? "status-completed"
      : "status-pending";

    return `
                    <div class="todo-card ${statusClass}">
                        <div class="todo-header">
                            <span class="todo-id">#${todo.id}</span>
                            <span class="todo-status ${statusBadgeClass}">${statusText}</span>
                        </div>
                        <div class="todo-title">${this.highlightSearchTerm(
                          todo.title
                        )}</div>
                        <div class="todo-user">
                            <span class="user-icon">👤</span>
                            <span>用戶 ${todo.userId}</span>
                        </div>
                    </div>
                `;
  }

  highlightSearchTerm(text) {
    if (!this.searchTerm) return text;

    const regex = new RegExp(`(${this.searchTerm})`, "gi");
    return text.replace(
      regex,
      '<mark style="background: #fef08a; padding: 2px 4px; border-radius: 3px;">$1</mark>'
    );
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredTodos.length / this.todosPerPage);
    const pagination = document.getElementById("pagination");

    if (totalPages <= 1) {
      pagination.style.display = "none";
      return;
    }

    pagination.style.display = "flex";

    // 更新上一頁/下一頁按鈕
    document.getElementById("prevBtn").disabled = this.currentPage === 1;
    document.getElementById("nextBtn").disabled =
      this.currentPage === totalPages;

    // 生成頁碼按鈕
    const pageNumbers = document.getElementById("pageNumbers");
    const pageButtons = [];

    // 計算要顯示的頁碼範圍
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(totalPages, this.currentPage + 2);

    // 調整範圍以確保總是顯示5個頁碼（如果可能）
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4);
      } else {
        startPage = Math.max(1, endPage - 4);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === this.currentPage;
      pageButtons.push(`
                        <button class="page-btn ${isActive ? "active" : ""}" 
                                onclick="todoApp.goToPage(${i})">${i}</button>
                    `);
    }

    pageNumbers.innerHTML = pageButtons.join("");
  }

  goToPage(page) {
    this.currentPage = page;
    this.render();
  }

  showError(title, message) {
    const content = document.getElementById("content");
    content.innerHTML = `
                    <div class="error">
                        <div class="error-icon">❌</div>
                        <h3>${title}</h3>
                        <p>${message}</p>
                        <button class="retry-btn" onclick="location.reload()">重新載入</button>
                    </div>
                `;
    document.getElementById("pagination").style.display = "none";
  }
}

// 初始化應用程式
const todoApp = new TodoApp();
