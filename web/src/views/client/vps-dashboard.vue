<template>
  <div style="background-color: var(--bs-bg); color: var(--bs-text-default);">
    <section
      v-if="
        $root.$children[0].user.vps.filter(
          (vps) => vps.parent == $root.$children[0].user.id
        ).length > 0
      "
    >
      <div>
        <div class="CardArea">
          <vpsInfoBlockVue
            v-for="(vpsInstance, index) of $root.$children[0].user.vps.filter(
              (vps) => vps.parent == $root.$children[0].user.id
            )"
            :key="index"
            :vpsInstance="vpsInstance"
          ></vpsInfoBlockVue>
        </div>
      </div>
    </section>
    <section v-else>
      <div class="horizontal-centered">
        <div class="no-servers-block-wrapper">
          <div class="no-servers-block">
            <p>No servers founds, you can order one via the oder tab.</p>
          </div>
        </div>
      </div>
    </section>
    <div class="powerConfirmationBox">
      <div
        class="modal-dialog"
        style="display: none"
        id="powerConfirmationDialog"
      >
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staticBackdropLabel">
              Confirm power action
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              @click="dismissPowerConfirmation()"
            ></button>
          </div>
          <div class="modal-body">
            {{ confirmationText }}
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
              @click="dismissPowerConfirmation()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="executePowerConfirmation()"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-servers-block-wrapper {
  width: 98%;
}
.no-servers-block {
  font-size: 16px !important;
  display: block;
  background-color: var(--bs-card-bg);
  padding: 15px;
  width: 95%;
  border-radius: 5px;
  height: 68px;
  position: absolute;
  left: 0;
  right: 0;
  margin: auto;
}
.CardArea {
  width: 85%;
  max-width: 1500px;
  margin: 10px auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

@media only screen and (max-width: 1200px) {
  .CardArea {
    width: 95%;
  }
}

@media only screen and (max-width: 800px) {
  .CardArea {
    width: 99%;
  }
}
.horizontal-centered {
  padding: 5px;
  width: 100%;
  text-align: center;
}
.powerConfirmationBox {
  color: #000000;
  position: fixed;
  left: 0;
  right: 0;
  top: 150px;
  z-index: 9;
}
.show {
  display: block !important;
}
</style>

<script>
import vpsInfoBlockVue from "../../components/vps-info-block.vue";

export default {
  methods: {
    showPowerConfirmation(text, callback, vpsInstance) {
      var vm = this;
      vm.poweractionConfirmationCallback = callback;
      vm.vpsInstance = vpsInstance;
      vm.confirmationText = text;
      document.getElementById(`powerConfirmationDialog`).classList.add("show");
    },
    dismissPowerConfirmation() {
      var vm = this;
      document
        .getElementById(`powerConfirmationDialog`)
        .classList.remove("show");
      vm.poweractionConfirmationCallback = null;
    },
    executePowerConfirmation() {
      var vm = this;
      if (vm.poweractionConfirmationCallback != null)
        vm.poweractionConfirmationCallback(vm.vpsInstance);
      vm.dismissPowerConfirmation();
    },
    create_hash_checksum(str, seed = 0) {
      let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;
      for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 =
        Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
        Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 =
        Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
        Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    },
    add_specific_server_to_list(uuid) {
      var vm = this;
      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps?include_iso=true`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
          "x-request-server": uuid,
        },
      })
        .then((res) => {
          res.json().then((data) => {
            if (data.success == true) {
              var already_in_list = vm.$root.$children[0].user.vps.find(
                (v) => v.uuid == uuid
              );

              if (data.data && already_in_list == null)
                vm.$root.$children[0].user.vps.push(data.data);
            }
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.api_base_url}/@me?options=["SKIP_SERVERS", "SKIP_VPSS"]`,
            },
            e
          );
        });
    },
  },
  mounted() {
    var vm = this;
    vm.refresh = setInterval(() => {
      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
          "x-data-strip": "true",
          "x-check-hash-latest": vm.data_hash,
        },
      })
        .then((res) => {
          res.json().then((data) => {
            if (data.success == false) {
              this.$root.$children[0].user = "";
              this.$root.$children[0].permissions = {};
              this.$router.push({
                path: "/login",
              });
            } else {
              for (var qemu_server of data.data) {
                var target = vm.$root.$children[0].user.vps.find(
                  (v) => v.uuid == qemu_server.uuid
                );
                if (target) {
                  Object.assign(target, qemu_server);
                } else {
                  vm.add_specific_server_to_list(qemu_server.uuid);
                  //console.log(qemu_server.uuid);
                }
              }

              if (data.data.length > 0) {
                for (var known_qemu_server of vm.$root.$children[0].user.vps) {
                  var data_target = data.data.find(
                    (v) => v.uuid == known_qemu_server.uuid
                  );
                  if (!data_target) {
                    var item_index = vm.$root.$children[0].user.vps.indexOf(
                      known_qemu_server
                    );
                    vm.$root.$children[0].user.vps.splice(item_index, 1);
                  }
                }
              }

              if (data.data.length > 0) {
                vm.data_hash = vm.create_hash_checksum(
                  btoa(JSON.stringify(data.data))
                );
              }
            }
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/vps`,
            },
            e
          );
        });
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.refresh);
  },
  data() {
    return {
      refresh: null,
      poweractionConfirmationCallback: null,
      vpsInstance: null,
      confirmationText: null,
      data_hash: "",
    };
  },
  components: {
    vpsInfoBlockVue,
  },
};
</script>
