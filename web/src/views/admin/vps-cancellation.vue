<template>
  <div style=" color: var(--bs-text-default);">
    <section
      v-if="
        $root.$children[0].user.vps.filter(
          (vps) => vps.renew == false && vps.is_share == false
        ).length > 0
      "
    >
      <div>
        <div class="CardArea">
          <vpsInfoBlockVue
            v-for="(vpsInstance, index) of $root.$children[0].user.vps.filter(
              (vps) => vps.renew == false
            )"
            :key="index"
            :vpsInstance="vpsInstance"
            :cancelNowOnly="true"
          ></vpsInfoBlockVue>
        </div>
      </div>
    </section>
    <section v-else>
      <p class="horizontal-centered">No servers found :)</p>
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
.CardArea {
  width: 100%;
  max-width: 1900px;
  margin: 10px auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

@media only screen and (max-width: 1200px) {
  .CardArea {
    width: 100%;
  }
}

@media only screen and (max-width: 800px) {
  .CardArea {
    width: 100%;
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
  },
  mounted() {
    var vm = this;
    vm.refresh = setInterval(() => {
      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
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
              this.$root.$children[0].user.vps = data.data;
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
    };
  },
  components: {
    vpsInfoBlockVue,
  },
};
</script>
