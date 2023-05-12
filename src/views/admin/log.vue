<template>
  <div class="page">
    <div class="CardArea">
      <div class="card">
        <div
          class="card-header"
          style="padding-left: 10px; display:inline-flex"
        >
          <i class="fad fa-user" style="color: #5c7cfa"></i>
          &nbsp;

          <p>Log</p>
        </div>
        <div class="card-body" style="padding: 10px">
          <table style="width:100%">
            <tr>
              <th>Event</th>
              <th>Data</th>
              <th>Affected</th>
              <th>By</th>
            </tr>
            <tr v-for="(log, index) in logs" :key="index">
              <td>{{ log.event.split("|")[0] }}</td>
              <td v-if="log.eventData != 'null'">{{ log.eventData }}</td>
              <td v-else>-</td>
              <td
                class="clickable"
                v-if="log.affectedObjects.split('.')[0] == 'user'"
                @click="manageUser(log.affectedObjects.split('.')[1])"
              >
                {{ log.affectedObjectsNamesAtExecution }} ({{
                  log.affectedObjects.split(".")[1]
                }})
              </td>
              <td
                :class="vpsClickable(log.affectedObjects.split('.')[1])"
                v-if="log.affectedObjects.split('.')[0] == 'vps'"
                @click="manageVps(log.affectedObjects.split('.')[1])"
              >
                {{ log.affectedObjectsNamesAtExecution }} ({{
                  log.affectedObjects.split(".")[1]
                }})
              </td>
              <td
                :class="serverClickable(log.affectedObjects.split('.')[1])"
                v-if="log.affectedObjects.split('.')[0] == 'server'"
                @click="manageServer(log.affectedObjects.split('.')[1])"
              >
                {{ log.affectedObjectsNamesAtExecution }} ({{
                  log.affectedObjects.split(".")[1]
                }})
              </td>

              <td
                class="clickable"
                v-if="log.executedBy.split('.')[0] == 'user'"
                @click="manageUser(log.executedBy.split('.')[1])"
              >
                {{ log.executedByNameAtExecution }} ({{
                  log.executedBy.split(".")[1]
                }})
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

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
  width: 95%;
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
  background-color: var(--bs-card-header-bg);
}
.clickable {
  cursor: pointer;
  color: var(--bs-primary);
}
</style>

<script>
export default {
  methods: {
    manageUser(id) {
      this.$router.push({
        path: `/admin/user/${id}`,
      });
    },
    manageVps(id) {
      var vm = this;
      var vps = vm.$root.$children[0].user.vps;
      var found = vps.find((v) => v.id == id);
      if (!found) return;
      this.$router.push({
        path: `/vps/${found.uuid}`,
      });
    },
    vpsClickable(id) {
      var vm = this;
      var vps = vm.$root.$children[0].user.vps;
      var found = vps.find((v) => v.id == id);
      if (found) return "clickable";
      return "";
    },
    manageServer(id) {
      var vm = this;
      var servers = vm.$root.$children[0].user.servers;
      var found = servers.find((v) => v.id == id);
      if (!found) return;
      window.open(`https://panel.yourdomain.com/server/${found.identifier}`);
    },
    serverClickable(id) {
      var vm = this;
      var servers = vm.$root.$children[0].user.servers;
      var found = servers.find((v) => v.id == id);
      if (found) return "clickable";
      return "";
    },
  },
  data() {
    return {
      logs: [],
    };
  },
  mounted() {
    var vm = this;
    fetch(`${vm.$root.$children[0].api_base_url}/@admin/log`, {
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
      },
    }).then((res) => {
      res.json().then((data) => {
        vm.$root.$children[0].checkMessage(data);
        vm.logs = data.data.reverse();
      });
    });
  },
};
</script>
