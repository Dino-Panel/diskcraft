<template>
  <div style="height: calc(100% - 65px);  overflow: hidden">
    <section class="top-bar">
      <div class="top-bar-content">
        <div class="top-bar-icon">
          <i class="fad fa-tasks-alt server-power-icon" style="color:green"></i>
        </div>
        <p class="top-bar-title">
          Admin Center
        </p>
      </div>
    </section>
    <section class="main-content">
      <section class="nav-side">
        <div class="nav-links">
          <div
            class="nav-link"
            @click="load_page('users')"
            :active="page == 'users'"
          >
            <i class="fal fa-users menu-item-icon"></i>
            <a>Users</a>
          </div>
          <div
            class="nav-link"
            @click="load_page('servers')"
            :active="page == 'servers'"
          >
            <i class="fal fa-server menu-item-icon"></i>
            <a>Servers</a>
          </div>
          <div
            class="nav-link"
            @click="load_page('servers_awaiting_cancel')"
            :active="page == 'servers_awaiting_cancel'"
          >
            <i class="fal fa-server menu-item-icon"></i>
            <a>Servers (No renewal)</a>
          </div>
          <div
            class="nav-link"
            @click="load_page('vps')"
            :active="page == 'vps'"
          >
            <i class="fal fa-clouds menu-item-icon"></i>
            <a>VPS</a>
          </div>
          <div
            class="nav-link"
            @click="load_page('vps_awaiting_cancel')"
            :active="page == 'vps_awaiting_cancel'"
          >
            <i class="fal fa-clouds menu-item-icon"></i>
            <a>VPS (No renewal)</a>
          </div>
        </div>
      </section>
      <section class="nav-content">
        <div class="users" v-if="page == 'users'">
          <div class="users-content page-default">
            <users></users>
          </div>
        </div>
        <div class="servers" v-if="page == 'servers'">
          <div class="servers-content page-default">
            <servers-all></servers-all>
          </div>
        </div>
        <div class="servers" v-if="page == 'servers_awaiting_cancel'">
          <div class="servers-awaiting-cancel content page-default">
            <servers-cancelation></servers-cancelation>
          </div>
        </div>
        <div vps="vps" v-if="page == 'vps'">
          <div class="servers-content page-default">
            <vps-all></vps-all>
          </div>
        </div>
        <div class="vps" v-if="page == 'vps_awaiting_cancel'">
          <div class="v[s-awaiting-cancel content page-default">
            <vps-cancelation></vps-cancelation>
          </div>
        </div>
      </section>
    </section>
  </div>
</template>

<script>
import users from "./users.vue";
import serversAll from "./server-dashboard-all.vue";
import serversCancelation from "./servers-cancellation.vue";
import vpsAll from "./vps-dashboard-all.vue";
import vpsCancelation from "./vps-cancellation.vue";

export default {
  components: { users, serversAll, serversCancelation, vpsAll, vpsCancelation },
  data() {
    return {
      page: "users",
    };
  },
  methods: {
    load_page(name) {
      this.page = name;
    },
  },
  mounted() {
    //var vm = this;
  },
  beforeDestroy() {
    clearInterval(this.refreshObject);
  },
};
</script>

<style>
/* PAGES */

.page-default {
  padding: 5px;
}

/* PAGES */

.top-bar-title {
  /* margin-bottom: 0px; */
  line-height: 55px;
  margin-left: 10px;
  font-size: 21px;
  width: fit-content;
}
.top-bar-icon {
  height: fit-content;
  position: relative;
  width: fit-content;
  font-size: 24px;
  top: 8px;
  left: 4px;
}
.top-bar-content {
  padding: 10px;
  line-height: 40px;
  margin-bottom: 0px;
  display: flex;
}
.inline {
  display: inline-flex;
}
.inline p {
  width: fit-content;
}
.overview-content {
  padding: 20px;
}
.overview-box {
  border-style: solid;
  border-radius: 5px;
  border-width: 1px;
}
.overview-box-title {
  position: relative;
  top: -12px;
  left: 10px;
  background-color: var(--bs-card-header-bg);
  width: fit-content;
  margin-bottom: 0px;
}
.overview-box-content {
  position: relative;
  top: -15px;
  left: 10px;
  margin-bottom: 0px;
}
.note {
  text-decoration: underline;
  text-decoration-color: var(--bs-primary);
  /* text-decoration-style: wavy; */
}
.nav-link[active] {
  color: var(--bs-primary);
}
.nav-content {
  color: var(--bs-text-default);
  border-radius: 5px;
  background-color: var(--bs-card-header-bg);
  backdrop-filter: opacity(0.5);
  margin-left: 5px;
  overflow-y: auto;
}
.nav-side {
  flex-grow: 5;
  color: var(--bs-text-default);
  border-radius: 5px;
  background-color: var(--bs-card-header-bg);
  backdrop-filter: opacity(0.5);
  max-width: 220px;
  min-width: 220px;
}
.nav-link {
  color: var(--bs-text-default);
  width: fit-content;
}
.menu-item-icon {
  width: 35px;
}
.nav-links {
  width: 100%;
  margin: 5px auto;
}
.nav-content {
  flex-grow: 95;
}
.main-content {
  display: flex;
  width: 98%;
  margin: 5px auto;
  height: calc(100% - 95px);
}
.top-bar {
  width: 98%;
  margin: 5px auto;
  border-radius: 5px;
  height: 75px;
  color: var(--bs-text-default);
  background-color: var(--bs-card-header-bg);
  backdrop-filter: opacity(0.5);
}

@keyframes breathing {
  0% {
    -webkit-transform: scale(0.9);
    -ms-transform: scale(0.9);
    transform: scale(0.9);
  }

  25% {
    -webkit-transform: scale(1);
    -ms-transform: scale(1);
    transform: scale(1);
  }

  60% {
    -webkit-transform: scale(0.9);
    -ms-transform: scale(0.9);
    transform: scale(0.9);
  }

  100% {
    -webkit-transform: scale(0.9);
    -ms-transform: scale(0.9);
    transform: scale(0.9);
  }
}
</style>
