
class Resp {
  constructor(status, errmsg, data = undefined) {
    this.status = status;
    this.errmsg = errmsg;
    this.data = data;
  }
}

module.exports = Resp;
