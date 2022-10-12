<template>
  <div class="page">
    <div class="CardArea">
      <div
        class="card"
        v-for="(user, index) of $root.$children[0].users"
        :key="index"
      >
        <div
          class="card-header"
          style="padding-left: 10px; display:inline-flex"
        >
          <i class="fad fa-user" style="color: #5c7cfa"></i>
          &nbsp;

          <p>{{ user.username }}</p>
        </div>
        <div class="card-body" style="padding: 10px">
          <b>Balance: </b
          >{{ $root.$children[0].api_capabilities.currency.symbol
          }}{{ user.balance }}<br />
          <b>Owned servers: </b
          >{{
            $root.$children[0].user.servers.filter(
              (server) => server.owner == user.pterodactyl_id
            ).length
          }}
          <br />
          <b>Owned VPSs: </b
          >{{
            $root.$children[0].user.vps.filter((vps) => vps.parent == user.id)
              .length
          }}<br />
          <div class="user-control-holder">
            <button
              v-if="
                $root.$children[0].user.vps.filter(
                  (vps) => vps.parent == user.id
                ).length > 0
              "
              class="btn btn-primary"
              style="color: var(--bs-button-text); min-height: 40px; margin: 5px"
              @click="gotoVpsOverviewUser(user.id)"
            >
              <i
                class="fad fa-eye"
                style="color: var(--bs-button-text);position: relative; left: -2px;"
              ></i>
              View VPSs
            </button>
            <button
              v-if="
                $root.$children[0].user.servers.filter(
                  (server) => server.owner == user.pterodactyl_id
                ).length > 0
              "
              class="btn btn-primary"
              style="color: var(--bs-button-text); min-height: 40px; margin: 5px"
              @click="gotoServerOverviewUser(user.pterodactyl_id)"
            >
              <i
                class="fad fa-eye"
                style="color: var(--bs-button-text);position: relative; left: -2px;"
              ></i>
              View Servers
            </button>
            <button
              class="btn btn-primary"
              style="color: var(--bs-button-text); min-height: 40px; margin: 5px"
              @click="gotoUserOverview(user.id)"
            >
              <i
                class="fad fa-eye"
                style="color: var(--bs-button-text);position: relative; left: -2px;"
              ></i>
              View user
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    gotoVpsOverviewUser(userId) {
      this.$router.push({
        path: `/admin/user/${userId}/vps`,
      });
    },
    gotoServerOverviewUser(pterodactylId) {
      this.$router.push({
        path: `/admin/user/${pterodactylId}/servers`,
      });
    },
    gotoUserOverview(userId) {
      this.$router.push({
        path: `/admin/user/${userId}`,
      });
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
        }
        vm.fetching_root = false;
      });
    });
  },
};
</script>

<style scoped>
.page {
  color: var(--bs-text-default);
}
.card-header p {
  margin-bottom: 0px;
  line-height: 28px;
  margin-left: 5px;
}
.card-header .fad {
  font-size: 20px;
}

.poweraction_btn {
  width: 40px !important;
  height: 40px !important;
  margin: 5px;
}
.CardArea {
  width: 100%;
  margin: 10px auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.CardArea .card {
  background-color: var(--bs-card-bg);
  min-width: fit-content;
  width: 30%;
  margin: 5px;
  flex-grow: 1;
}
.CardArea .card .card-header {
  background-color: var(--bs-card-header);
}

@media only screen and (max-width: 1200px) {
  .CardArea {
    width: 100%;
  }
  .card {
    width: 100% !important;
  }
}
@media only screen and (max-width: 800px) {
  .CardArea {
    width: 100%;
  }
  .vpsInfoChart {
    display: none;
  }
  .btn-group,
  .btn {
    width: 100%;
  }
  .serverControlls {
    width: 100%;
  }
  .user-control-holder {
    width: 100%;
    position: relative;
    left: -5px;
  }
}
@media only screen and (min-width: 800px) {
  .user-control-holder {
    float: right;
  }
}
</style>
