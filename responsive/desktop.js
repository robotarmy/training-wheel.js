window.TW = {
  displayUrlAsCode: function(id,url,_mode) {
    var mode = _mode || 'javascript-hint';
    var response = $.ajax({type:'get',url:url,async:false});
    var code = "Invalid response";
    if (response) {
      code = response.responseText;
    }
    CodeMirror.runMode(code,mode,document.getElementById(id));
  },

  displayUrlAsObject: function(id,url) {
    document.getElementById(id).src = url;
  },

  listen: function() {
    var self = this;
    $('a.demo').off();
    $('a.demo').on('click',function() {
     self.displayUrlAsObject('example-demo',this.href);
     self.displayUrlAsCode('source-code',this.href);
     return false;
    });
  }
};

$(document).ready(function() {
  TW.listen();
});

