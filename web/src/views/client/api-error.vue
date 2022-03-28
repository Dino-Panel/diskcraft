<template>
  <div class="messageBox">
    <div class="centeredLinkIcon">
      <i class="fad fa-link linkIcon"></i>
    </div>
    <h1>We're sorry, we couldn't reach our API to serve you some data.</h1>
  </div>
</template>

<style scoped>
.messageBox {
  color: var(--bs-text-default);
  margin: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.fad {
  color: var(--bs-text-default);
}
.linkIcon {
  font-size: 3rem;
}
.centeredLinkIcon {
}
</style>
