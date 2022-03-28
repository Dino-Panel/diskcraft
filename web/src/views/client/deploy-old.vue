<template>
  <div>
    <div v-if="state == 'error'">
      <div class="CardArea CardArea_Subcards">
        <div class="card">
          <div class="card-header" style="padding-left: 10px">
            Deployment error.
          </div>
          <div class="card-body" style="padding: 5px">
            {{ deploy_error }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="state == 'deploying'">
      <div class="CardArea CardArea_Subcards">
        <div class="card">
          <div class="card-header" style="padding-left: 10px">
            <div
              class="spinner-border text-primary"
              role="status"
              style="width: 25px; height: 25px; float: right"
            >
              <span class="visually-hidden">Loading...</span>
            </div>
            Deploying server...
          </div>
          <div class="card-body" style="padding: 5px">
            Please wait while your server is being created...
          </div>
        </div>
      </div>
    </div>
    <div v-if="state == 'start'">
      <div class="CardArea">
        <div
          class="accordion"
          style="margin-top: 10px; border-style: none !important;"
          v-if="data.vps"
        >
          <div class="accordion-item">
            <h2 class="accordion-header" :id="'heading_vps'">
              <button
                class="accordion-button open"
                type="button"
                data-bs-toggle="collapse"
                :data-bs-target="'#collapse_vps'"
                aria-expanded="true"
                :aria-controls="'collapse_vps'"
              >
                Virtual Private Servers
              </button>
            </h2>
            <div
              :id="'collapse_vps'"
              class="accordion-collapse collapse"
              aria-labelledby="headingOne"
              :data-bs-parent="'#heading_vps'"
            >
              <div class="accordion-body">
                <section class="CardArea_Subcards" style="display: flex;">
                  <div
                    class="card text-center"
                    v-for="(vpsPackage, index) in data.vps"
                    :key="index + 99999"
                  >
                    <div class="card-body">
                      <h5 class="card-title">VPS {{ index + 1 }}</h5>
                      <div class="card-text" style="text-align: left">
                        <ul class="list-group list-group-flush">
                          <li class="list-group-item">
                            <i class="fad fa-microchip"></i>

                            {{ vpsPackage.coreCount }}
                            core{{ vpsPackage.coreCount != 1 ? "s" : "" }}
                          </li>
                          <li class="list-group-item">
                            <i class="fad fa-memory"></i>
                            {{ vpsPackage.ram }} GB
                          </li>
                          <li class="list-group-item">
                            <i class="fad fa-hdd"></i>
                            {{ vpsPackage.disk }} GB
                          </li>
                          <li class="list-group-item">
                            <i class="far fa-euro"></i>
                            {{ priceFixer(vpsPackage.price) }}
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div class="card-footer text-muted">
                      <a
                        href="#"
                        class="btn btn-primary"
                        @click="deployVps(vpsPackage.system_name)"
                        ><i
                          style="color: var(--bs-button-text);position: relative; left: -2px;"
                          class="fad fa-bags-shopping"
                        ></i>
                        Deploy</a
                      >
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
        <div
          class="accordion"
          style="margin-top: 10px; border-style: none !important;"
          id="accordionExample"
          v-for="(category, index) in data.pterodactyl"
          :key="index"
        >
          <div class="accordion-item">
            <h2 class="accordion-header" :id="'heading' + index">
              <button
                class="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                :data-bs-target="'#collapse' + index"
                aria-expanded="true"
                :aria-controls="'collapse' + index"
              >
                {{ category.friendlyName }}
              </button>
            </h2>
            <div
              :id="'collapse' + index"
              class="accordion-collapse collapse"
              aria-labelledby="headingOne"
              :data-bs-parent="'#heading' + index"
            >
              <div class="accordion-body">
                <section class="CardArea_Subcards" style="display: flex;">
                  <div
                    class="card text-center"
                    v-for="(container, index) in category.list"
                    :key="index + 999"
                  >
                    <div class="card-body">
                      <h5 class="card-title">{{ container.friendly_name }}</h5>
                      <div class="card-text" style="text-align: left">
                        <ul class="list-group list-group-flush">
                          <li class="list-group-item">
                            <i class="fad fa-microchip"></i>

                            {{ container.cpu }}% ({{
                              container.cpu / 100
                            }}
                            core{{ container.cpu / 100 != 1 ? "s" : "" }})
                          </li>
                          <li class="list-group-item">
                            <i class="fad fa-memory"></i>
                            {{
                              container.ram > 1023 == false
                                ? container.ram + "MB"
                                : container.ram / 1024 + "GB"
                            }}
                          </li>
                          <li class="list-group-item">
                            <i class="fad fa-hdd"></i>
                            {{
                              container.disk > 1023 == false
                                ? container.disk + "MB"
                                : container.disk / 1024 + "GB"
                            }}
                          </li>
                          <li class="list-group-item">
                            <i class="fad fa-database"></i>
                            {{ container.dbs }}
                          </li>
                          <li class="list-group-item">
                            <i class="fad fa-backpack"></i>
                            {{ container.backups }}
                          </li>
                          <li class="list-group-item">
                            <i class="far fa-euro"></i>
                            {{ priceFixer(container.default_price) }}
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div class="card-footer text-muted">
                      <a
                        href="#"
                        class="btn btn-primary"
                        @click="deploy(container.system_name)"
                        ><i
                          style="color: var(--bs-button-text);position: relative; left: -2px;"
                          class="fad fa-bags-shopping"
                        ></i>
                        Deploy</a
                      >
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.CardArea_Subcards {
  width: 95%;
  margin: 10px auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.CardArea {
  color: var(--bs-text-default);
  width: 95%;
  margin: 10px auto;
}
.CardArea .card {
  background-color: var(--bs-card-bg);
  width: 350px;
  margin: 5px;
  flex-grow: 1;
  color: var(--bs-text-default);
}
.list-group-item {
  color: var(--bs-text-default);
}
.accordion-body {
  background-color: var(--bs-card-header-bg);
}
.accordion-button {
  background-color: var(--bs-card-bg);
  color: var(--bs-text-default);
}
.list-group-item {
  background-color: var(--bs-card-bg);
}
.CardArea .card .card-header {
  background-color: var(--bs-card-header-bg);
}
</style>

<script>
export default {
  mounted() {
    var vm = this;
    fetch(`${vm.$root.$children[0].api_base_url}/@me/deploy`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
      },
    }).then((res) => {
      res.json().then((data) => {
        if (data.success == false) {
          vm.$root.$children[0].checkMessage(data);
        }
        vm.data = data.data;
      });
    });
  },
  methods: {
    priceFixer(input) {
      if (input.toString().includes(".")) {
        var returnStr = (Math.round(input * 10000) / 10000)
          .toString()
          .replace(".", ",");
        if (returnStr.split(",")[1] && returnStr.split(",")[1].length == 1)
          returnStr += `0`;

        if (returnStr.split(",")[1] == null) returnStr += `,00`;

        return returnStr;
      } else {
        return input + ",00";
      }
    },
    formatBytes(bytes, decimals = 2) {
      if (bytes === 0) return "0 Bytes";

      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    },
    deploy(type) {
      var vm = this;
      vm.state = "deploying";
      fetch(`${vm.$root.$children[0].api_base_url}/@me/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          service: "pterodactyl",
          package: type,
        }),
      }).then((res) => {
        res.json().then((data) => {
          vm.$root.$children[0].checkMessage(data);
          if (data.success == false) {
            vm.deploy_error = data.messages[0].humandFriendly;
            vm.state = "error";
          } else {
            vm.$router.push({
              path: "/servers",
            });
          }
        });
      });
    },

    deployVps(type) {
      var vm = this;
      vm.state = "deploying";
      fetch(`${vm.$root.$children[0].api_base_url}/@me/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          service: "vps",
          package: type,
        }),
      }).then((res) => {
        res.json().then((data) => {
          vm.$root.$children[0].checkMessage(data);
          if (data.success == false) {
            vm.deploy_error = data.messages[0].humandFriendly;
            vm.state = "error";
          } else {
            vm.$router.push({
              path: "/vps-manager",
            });
          }
        });
      });
    },
  },
  data() {
    return {
      data: [],
      deploy_error: "Joe",
      state: "start",
    };
  },
};
</script>
