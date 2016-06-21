function Timer (initialTime) {
  this.time = initialTime || 0;

  this.start = function () {
    this._showTimer()
    var me = this;
    this.counter = setTimeout(function(){
        me.time ++;
        me.start();
    }, 1000);
  }

  this.stop = function () {
    clearTimeout(this.counter);
  }

  this.reset = function () {
    this.stop();
    this.time = 0;
    this._showTimer();
  }

  this._showTimer = function () {
    document.getElementById('timer').innerText = this.time;
  }
}
var timer = new Timer();

var $toggler = document.getElementById("toggle-timer");
$toggler.addEventListener('click', function(){
  var currentClass = this.getAttribute('class');

  if(currentClass === 'active') {
    this.setAttribute('class', '')
    this.innerText = 'Start';
    timer.stop();
  } else {
    this.setAttribute('class', 'active')
    this.innerText = 'Stop';
    timer.start();
  }
});

document.getElementById("reset-timer").addEventListener('click', function(){
  timer.reset();
  $toggler.setAttribute('class', '');
  $toggler.innerText = 'Start';
})



