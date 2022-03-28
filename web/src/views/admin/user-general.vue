<template>
  <div class="cards">
    <div class="card">
      <div class="card-header" style="padding-left: 10px; display:inline-flex">
        <i class="fad fa-euro-sign" style="color: #5c7cfa"></i>
        &nbsp;

        <p>About</p>
      </div>
      <div class="card-body" style="padding: 10px">
        <table style="width:100%">
          <tr>
            <td><b>Username</b></td>
            <td>{{ userInfo().username }}</td>
          </tr>
          <tr>
            <td><b>First name</b></td>
            <td>{{ userInfo().first_name }}</td>
          </tr>
          <tr>
            <td><b>Last name</b></td>
            <td>{{ userInfo().last_name }}</td>
          </tr>
          <tr>
            <td><b>Full name</b></td>
            <td>{{ userInfo().first_name }} {{ userInfo().last_name }}</td>
          </tr>
          <tr>
            <td><b>Email</b></td>
            <td>{{ userInfo().email }}</td>
          </tr>
          <tr>
            <td><b>Phone number</b></td>
            <td>{{ userInfo().phone }}</td>
          </tr>
          <tr>
            <td><b>Balance</b></td>
            <td>&euro;{{ userInfo().balance }}</td>
          </tr>
          <tr>
            <td><b>Pterodactyl User Id</b></td>
            <td>{{ userInfo().pterodactyl_id }}</td>
          </tr>
          <tr>
            <td><b>Admin User</b></td>
            <td>{{ userInfo().admin }}</td>
          </tr>

          <tr>
            <td><b>Activated</b></td>
            <td>{{ userInfo().activated }}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header" style="padding-left: 10px; display:inline-flex">
        <i class="fad fa-user-shield" style="color: #5c7cfa"></i>
        &nbsp;
        <p>Permissions</p>
      </div>
      <div class="card-body" style="padding: 10px">
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            value=""
            id="flexCheckDefault"
            :checked="user.permissions.can_add_credit == true"
            @change="updatePermission('can_add_credit', $event.target.checked)"
          />
          <label class="form-check-label" for="flexCheckDefault">
            Add balance
          </label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            value=""
            id="flexCheckDefault"
            :checked="user.permissions.can_enable_pterodactyl == true"
            @change="
              updatePermission('can_enable_pterodactyl', $event.target.checked)
            "
          />
          <label class="form-check-label" for="flexCheckDefault">
            Link/Create Pterodactyl account
          </label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            value=""
            id="flexCheckDefault"
            :checked="user.permissions.can_deploy == true"
            @change="updatePermission('can_deploy', $event.target.checked)"
          />
          <label class="form-check-label" for="flexCheckDefault">
            Deploy servers & VPSs
          </label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="flexCheckDefault"
            :checked="user.permissions.can_change_password == true"
            @change="
              updatePermission('can_change_password', $event.target.checked)
            "
          />
          <label class="form-check-label" for="flexCheckDefault">
            Change password
          </label>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header" style="padding-left: 10px; display:inline-flex">
        <i class="fad fa-server" style="color: #5c7cfa"></i>
        &nbsp;

        <p>Pterodactyl Servers</p>
      </div>
      <div class="card-body" style="padding: 10px">
        <table style="width:100%">
          <tr>
            <th>Name</th>
            <th>Identifier</th>
            <th>CPU Cores</th>
            <th>RAM</th>
            <th>Storage</th>
            <th>Price</th>
            <th>Suspended</th>
            <th>Online</th>
            <th>Renew</th>
          </tr>
          <tr v-for="(server, index) of userServers()" :key="index">
            <td>{{ server.name }}</td>
            <td>{{ server.identifier }}</td>
            <td>{{ server.limits.cpu / 100 }}</td>
            <td v-if="server.limits.memory < 1024">
              {{ server.limits.memory }} MB
            </td>
            <td v-else>{{ server.limits.memory / 1024 }} GB</td>
            <td>{{ server.limits.disk / 1024 }} GB</td>
            <td>&euro;{{ server.price }}</td>
            <td>{{ server.suspended }}</td>
            <td>{{ server.online }}</td>
            <td>{{ server.renew }}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header" style="padding-left: 10px; display:inline-flex">
        <i class="fad fa-server" style="color: #5c7cfa"></i>
        &nbsp;

        <p>Virtual Private Servers</p>
      </div>
      <div class="card-body" style="padding: 10px">
        <table style="width:100%">
          <tr>
            <th>Name</th>
            <th>Primary IPv4</th>
            <th>CPU Cores</th>
            <th>RAM</th>
            <th>Storage</th>
            <th>Price</th>
            <th>Suspended</th>
            <th>Status</th>
            <th>Renew</th>
            <th>Node</th>
          </tr>
          <tr v-for="(server, index) of userVpss()" :key="index">
            <td>{{ server.name }}</td>
            <td>{{ server.ip }}</td>
            <td>{{ server.hardware.cpuCores }}</td>
            <td v-if="server.hardware.ram < 1024">
              {{ server.hardware.ram }} MB
            </td>
            <td v-else>{{ server.hardware.ram / 1024 }} GB</td>
            <td>{{ server.hardware.disk / 1024 }} GB</td>
            <td>&euro;{{ server.price }}</td>
            <td>{{ server.suspended }}</td>
            <td>{{ server.status }}</td>
            <td>{{ server.renew }}</td>
            <td>{{ server.node }}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="card" style="display: none">
      <div class="card-header" style="padding-left: 10px; display:inline-flex">
        <i class="fad fa-euro-sign" style="color: #5c7cfa"></i>
        &nbsp;

        <p>Balance</p>
      </div>
      <div class="card-body" style="padding: 10px">
        <div class="input-group mb-3">
          <span class="input-group-text" id="basic-addon1"> &euro;</span>
          <input
            id="creditAmountAdding"
            type="number"
            class="form-control"
            placeholder="Amount"
            aria-label="Amount"
            value="5"
            max="100"
            min="5"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    userServers() {
      var vm = this;
      return vm.servers.filter(
        (server) => server.owner == vm.userInfo().pterodactyl_id
      );
    },
    userVpss() {
      var vm = this;
      return vm.vps.filter((vps) => vps.parent == vm.userInfo().id);
    },
    updatePermission(perm, value) {
      var vm = this;
      this.user.permissions[perm] = value;
      fetch(
        `${vm.$root.$children[0].api_base_url}/@admin/user/${
          vm.userInfo().id
        }/permissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
          },
          body: JSON.stringify(vm.user.permissions),
        }
      ).then((res) => {
        res.json().then((data) => {
          this.$root.$children[0].checkMessage(data);
        });
      });
    },
    userInfo() {
      var vm = this;
      return vm.$root.$children[0].users.find(
        (user) => user.id == vm.$route.params.user_id
      );
    },
  },
  mounted() {
    var vm = this;
    fetch(`${vm.$root.$children[0].api_base_url}/@admin/users`, {
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
      },
    }).then((res) => {
      res.json().then((data) => {
        if (vm.is_verify_email == true) return;
        this.$root.$children[0].checkMessage(data);
        if (data.success == false) {
          //
        } else {
          vm.$root.$children[0].users = data.data;
          vm.user.permissions = vm.userInfo().permissions;
        }
        vm.fetching_root = false;
      });
    });

    fetch(`${vm.$root.$children[0].api_base_url}/@me`, {
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
      },
    }).then((res) => {
      res.json().then((data) => {
        vm.servers = data.data.servers;
        vm.vps = data.data.vps;
      });
    });
  },
  data() {
    return {
      servers: [],
      vps: [],
      user: {
        permissions: {
          can_add_credit: true,
          can_change_password: true,
          can_deploy: true,
          can_enable_pterodactyl: true,
        },
      },
    };
  },
};
</script>

<style scoped>
.cards {
  width: 95%;
  margin: 10px auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  color: var(--bs-text-default);
}
.card-header p {
  margin-bottom: 0px;
  line-height: 28px;
  margin-left: 5px;
  color: var(--bs-text-default);
}
.card-header .fad {
  font-size: 20px;
}
.card {
  background-color: var(--bs-card-bg);
  width: 45%;
  min-width: fit-content;
  margin: 5px;
  flex-grow: 1;
}
.card .card-header {
  background-color: var(--bs-card-header-bg);
}
</style>
