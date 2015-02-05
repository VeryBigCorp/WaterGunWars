var login = false;
var name;
var easy = false;
var prev = new Array();
var prevInd = -1;
var ajax;
var usr;
var currField;
if(window.XMLHttpRequest){
    ajax = new XMLHttpRequest();
} else {
    ajax = new ActiveXObject("Microsoft.XMLHTTP");
}
$("#conf").easyconfirm({locale: { title: 'Confirm a kill?', text: 'Your target or the moderator will also have to confirm your kill.', button: ['Cancel','Confirm']}});
$("#conf").click(function(){
    conf();
    doLoginStuff();
});

$("#kia").easyconfirm({locale: { title: 'KIA?', text: 'Have you been killed in action by another agent?', button: ['No','Yes']}});
$("#kia").click(function(){
    kill();
    doLoginStuff();
});

$("#dispute").easyconfirm({locale: { title: 'Dispute?', text: 'If you select \'yes\', the moderator will be notified of your dispute claim.', button: ['No','Yes']}});
$("#dispute").click(function(){
    dispute();
});

$("#send").click(function(){
    if(confirm('Send mass message?')){
        ajax.open("POST", "login.php", true);
        ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        ajax.send("a=mass&text="+$("#text").val());
        ajax.onreadystatechange = function(){
            if(ajax.readyState == 4 && ajax.status == 200){
                alert("Sent!");
            }
        };
    }
});
    
    function setfocus(id, sel) {
        if (document.getElementById) {
           document.getElementById(id).focus();
           if(sel)
            document.getElementById(id).select();
        }
    }
    
   function notif(e, c){
       if(c != "DISP" && c != "CONF") {
       ajax.open("POST", "login.php", false);
       ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
       ajax.send("a=resolveNotif&id="+e);
       if(ajax.status === 200){
           outputToConsole(ajax.responseText);
       }
       return;
   	}
   }
   
   function disp(id,y){
       var text = "Clicking yes will resolve the dispute, meaning that the killer wins.";
   if(!y)
    text = "Clicking yes will reset the kill, making the killer have to attempt again.";
   $("#ye").easyconfirm({locale: { title: 'Dispute', text: text + " Otherwise, click no and then click on the other link in the notification.", button: ['No','Yes']}});
   $("#ye").click(function(){
        ajax.open("POST", "login.php", false);
        ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        ajax.send("a=resolveNotif&id="+id+"&yes="+y);
        if(ajax.status === 200){
            outputToConsole(ajax.responseText);
        }
   });
   $("#ye").click();
   }
   
   function con(id, y){
   	var text = "Clicking yes will confirm the kill, meaning that the killer wins.";
   if(!y)
    text = "Clicking yes will resolve the kill, making the killer have to attempt again.";
   $("#ye").easyconfirm({locale: { title: 'Confirm', text: text + " Otherwise, click no and then click on the other link in the notification.", button: ['No','Yes']}});
   $("#ye").click(function(){
        ajax.open("POST", "login.php", false);
        ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        ajax.send("a=resolveNotif&id="+id+"&yes="+y);
        if(ajax.status === 200){
            outputToConsole(ajax.responseText);
        }
   });
   $("#ye").click();
   }
    
    window.onclick = function(el){
        if(el.target.nodeName != "INPUT")
    	if(!easy)
        	setfocus('in', true);
};

var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

document.getElementById('logout').onclick = function(){
    if(!loggedIn()){
        outputToConsole("<i>You are not logged in.</i>");
        return;
    }
    outputToConsole("Logging out...");
    ajax.open("POST", "login.php", true);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("a=logout");
    ajax.onreadystatechange = function(){
        if(ajax.readyState == 4 && ajax.status == 200){
            outputToConsole(ajax.responseText);
            ajax.onreadystatechange = null;
            //doLogoutStuff();
            location.reload();
        }
    };
};

document.getElementById('form').onsubmit = function(){
    var usr = document.getElementById('usr').value;
    var pass = document.getElementById('pass').value;
    
    login = true;
    outputToConsole("Logging in...");
    ajax.open("POST", "login.php", true);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("u="+usr+"&p="+pass+"&a=login");
    ajax.onreadystatechange = function(){
        if(ajax.readyState == 4 && ajax.status == 200){
            ajax.onreadystatechange = null;
            var text = ajax.responseText;
            if(ajax.responseText == "unauthorized"){
                text = "<font color='red'>unauthorized login! Please try again</font>";
                var err = document.getElementById('err');
                err.innerHTML = "Username or password incorrect. Please try again";
                err.style.display = "inline";
            } else {
                doLoginStuff();
                loadNotifications();
                outputToConsole("<i><font color='white'>More commands available. Type 'help' and then enter to view the new commands.<font></i>");

            }
            outputToConsole(text);
        }
        login = false;
       
    };
    return false;
};

function getUsr(){
    
    ajax.onreadystatechange = null;
    ajax.open("POST", "login.php", false);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("a=get_usr");
    if(ajax.status == 200){
        return ajax.responseText;
    }
}

function doLoginStuff(){
    ajax.onreadystatechange = null;
    document.getElementById('formdiv').style.display = "none";
    document.getElementById('logout').style.display = "inline";
    document.getElementById('loggedin').style.display = "block";
    
    if(admin() == false){
        if(prompting()){
            $("#conf").replaceWith("<p>Waiting for target confirmation...</p>");
            $("#confirm").html("");
        } else {
            $("#conf").replaceWith("<input style='width:90%' class='button' type='button' id='conf' value='Confirm Kill'/>");
            $("#confirm").html("Click to confirm a kill on your target");
        }
        
        if(get("prompt") == "1"){
            $("#conf").replaceWith();
            $("#confirm").html("");
            $("#target").html("<font style='font-size:25px;'>An agent has confirmed a kill on you. You can either validate it by clicking 'KIA' or dispute it by clicking 'Dispute Kill'.</font>");
            outputToConsole("<font style='font-size:25px;color:red;'>An agent has confirmed a kill on you. You can either validate it by clicking 'KIA' or dispute it by clicking 'Dispute Kill'.</font>");
            $("#dispute").css('display','inline');
        } else {
            $("#dispute").css('display','none');
            $("#conf").replaceWith("<input style='width:90%' class='button' type='button' id='conf' value='Confirm Kill'/>");
            $("#confirm").html("Click to confirm a kill on your target");
        }
        
        if(disputing()){
            $("#table").css('display','none');
            $("#target").html("<font style='font-size:18px;'>Your death is being reviewed by the moderator.</font>");
        }
        
        if(get("dispute") == "1"){
            $("#table").css('display','none');
            $("#target").html("<font style='font-size:18px;'>Your kill is being reviewed by the moderator.</font>");
        }
        
        if(kia()){
            $("#target").html("<font color='yellow'>You've been killed in action.</font>");
            $("#table").css('display','none');
        } else {
            $("#target").html("Your target is <font color='yellow'>"+get("target")+"</font>");
            $("#table").css('display','block');
        }
        
        if(!gameStarted()){
            $("#table").css('display','none');
            $("#target").html("The game has not started.");
            $("#in").css('display','none');
            outputToConsole("<font color='red'>The game hasn't started yet. Be patient.</font>");
        }
        
        if(inactive()){
        	$("#target").html("<font color='yellow'>You've been inactive for seven days. You are out.</font>");
            $("#table").css('display','none');
        }
        $("#admin").css('display','none');
    } else {
        
        $("#admin").css('display','block');
        $("#target").html("Do admin stuff");
        $("#table").css('display','none');
        
        
        if(!isMobile.any()){
            $("#text").css('width','30%');
        } else {
            $("#text").css('width','100%');
        }
        
    }
    
    $("#conf").easyconfirm({locale: { title: 'Confirm a kill?', text: 'Your target or the moderator will also have to confirm your kill.', button: ['Cancel','Confirm']}});
    $("#conf").click(function(){
        conf();
        doLoginStuff();
    });
    
    usr = getUsr();
    $("#name").html("Wecome, agent "+usr + ".");
    document.getElementById('usr').value = "";
    document.getElementById('pass').value = "";
}

function doLogoutStuff(){
    document.getElementById('formdiv').style.display = "block";
    document.getElementById('logout').style.display = "none";
    document.getElementById('loggedin').style.display = "none";
}

function gameStarted(){
    ajax.open("POST", "login.php", false);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("a=started");
    if(ajax.status == 200){
        if(ajax.responseText == true)
        	return true;
    	return false;
    }
}

function isEasy(){
    ajax.open("POST", "login.php", false);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("a=interfaceMode");
    if(ajax.status == 200){
        if(ajax.responseText == "easy")
            return true;
        return false;
    }
}

function setEasy(e){
    var res;
    if(e) res = "easy";
    else res = "console";
    ajax.open("POST", "login.php", false);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("a=changemode&m="+res);
}

function doEasy(set, login){
    if(!easy){
        easy = true;
        document.getElementById("out").style.display = "none";
        document.getElementById("in").style.display = "none";
        document.getElementById("main-container").style.backgroundColor="#33CCFF";
        document.body.style.backgroundColor="#33CCFF";
        document.getElementById("interface").style.display = "block";
        document.getElementById("gui").setAttribute("value", "Use console");
        
    } else {
        easy = false;
        document.getElementById("out").style.display = "block";
        document.getElementById("in").style.display = "inline";
        document.getElementById("main-container").style.backgroundColor="black";
        document.body.style.backgroundColor="black";
        document.getElementById("interface").style.display = "none";
        setfocus('in', true);
        document.getElementById("gui").setAttribute("value", "Click for easy interface");
        }
        if(loggedIn() && login){
            doLoginStuff();
        } else if(login){
            doLogoutStuff();
        }
        if(set)
           setEasy(easy);
    }
   
    function outputToConsole(text) {
        var c = document.getElementById('out');
    c.innerHTML =  c.innerHTML + "<p>" + text + "</p>";
}

function loggedIn(){
    ajax.open("POST", "login.php", false);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("a=verifylogin");
    if(ajax.status === 200){
        if(ajax.responseText == "1")
            return true;
        return false;
    }
}

function prompting(){
    ajax.open("POST", "login.php", false);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("a=prompting");
    if(ajax.status === 200){
        if(ajax.responseText == "1")
            return true;
        return false;
    }
}

function kia(){
    return get("kia") == "1";
}

function admin(){
    ajax.open("POST", "login.php", false);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("a=isadmin");
    if(ajax.status === 200){
        if(ajax.responseText == "1")
            return true;
        return false;
    }
}

function lastCommand(){
    var comm = prev[prevInd];
    if(comm == null)
        return;
    document.getElementById('in').value = comm;
    prevInd--;
}

function get(val){
	ajax.open("POST", "login.php", false);
	ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	ajax.send("a=get&g="+val);
	if(ajax.status === 200){
		return ajax.responseText;
	}
}

function conf(){
    ajax.open("POST", "login.php", false);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("a=confirm");
    if(ajax.status === 200){
        outputToConsole(ajax.responseText);
    }
}

function kill(){
    if(admin()) return;
    ajax.open("POST", "login.php", false);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("a=kia");
    if(ajax.status === 200){
        outputToConsole(ajax.responseText);
    }
}

function dispute(){
    ajax.open("POST", "login.php", false);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("a=dispute");
    if(ajax.status === 200){
        outputToConsole(ajax.responseText);
        doLoginStuff();
    }
}

function loadNotifications(){
    if(!admin()) return;
    ajax.open("POST", "login.php", true);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("a=notif");
    ajax.onreadystatechange = function(){
        if(ajax.readyState == 4 && ajax.status == 200){
            outputToConsole("<br/><font style='font-size:18px;'>Notifications:</font><br/>");
            outputToConsole(ajax.responseText);
            ajax.onreadystatechange = null;
        }
       
    };
}

function disputing(){
    ajax.open("POST", "login.php", false);
    ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    ajax.send("a=disputing");
    if(ajax.status === 200){
        return ajax.responseText == "1";
    }
}

function inactive(){
	return get("inactive") == true;
}

function addPlayer(){
	if(admin()){
        ajax.open("POST", "login.php", true);
        ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        ajax.send("cname="+$("#add_codename").val()+"&rname="+$("#add_first").val()+" "+$("#add_last").val()+"&tel="+$("#add_cell").val()+"&carrier="+$("#carriers").find(":selected").val()+"&a=insert");
        ajax.onreadystatechange = function(){
            if(ajax.readyState == 4 && ajax.status == 200){
                outputToConsole(ajax.responseText);
                ajax.onreadystatechange = null;
                $("#add_codename").val("");
                $("#add_first").val("");
                $("#add_last").val("");
                $("#add_cell").val("");
            }
           
        };
        return false;
    }
}
/*function edit(field){
	if(currField != null){
		stopEdit(currField);
	}
   if($(field).children().is(('input'))) return;
   var text =  field.innerHTML;
   $(field).empty();
   $(field).append("<input name='" + $(field).attr('id') + "' type='text' value='"+text+"'/>");
   currField = $(field).attr('id');
   $("[name="+currField+"]").bind('keydown', function(e){
   		if(e.keyCode == 13){
   			stopEdit(currField);
   		}
   });
}

function stopEdit(field){
	var f = $("[name="+field+"]");
	var r = $("[id="+field+"]");
	r.html(f.val());
	update(f.id, f.className, f.value);
	f.remove();
	
}

function update(id, field, data){
	
}*/

var COMMANDS = [
    {
        name: "login",
        admin: false,
        login: false,
        description: " [codename] [password] : does what it says on the tin. Example: </i> login agentsmith hunter2 <i>",
        handler: function(args){
            if(args.length <= 1){
                outputToConsole("<font color='yellow'>Command arguments not entered properly. Use as '<i>login [codename] [password]</i>'</font>");
                return;
            }
            
            login = true;
            outputToConsole("Logging in...");
            ajax.open("POST", "login.php", true);
            ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
            ajax.send("u="+args[0]+"&p="+args[1]+"&a=login");
            ajax.onreadystatechange = function(){
                if(ajax.readyState == 4 && ajax.status == 200){
                    var text = ajax.responseText;
                    if(ajax.responseText == "unauthorized")
                        text = "<font color='red'>unauthorized login! Please try again</font>";
                    else{
                        doLoginStuff();
                        loadNotifications();
                        outputToConsole("<i><font color='white'>More commands available. Type 'help' and then enter to view the new commands.<font></i>");
                        prev[prev.length-1] = null;
                        prevInd--;
                		if(isIE()){
		                    $("#IE").css('display','inline');
		                } else {
		                    $("#IE").css('display','none');
		                	
		                }
                    }
                    outputToConsole(text);
                    ajax.onreadystatechange = null;
                }
                
                login = false;
            };
        }
    },
    {
        name: "quit",
        admin: false,
        login: false,
        description: ": log out of console",
        handler: function(){
            if(!loggedIn()){
                outputToConsole("<i>You are not logged in.</i>");
                return;
            }
            outputToConsole("Logging out...");
            ajax.open("POST", "login.php", true);
            ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
            ajax.send("a=logout");
            ajax.onreadystatechange = function(){
                if(ajax.readyState == 4 && ajax.status == 200){
                    outputToConsole(ajax.responseText);
                    //doLogoutStuff();
                    location.reload();
                    ajax.onreadystatechange = null;
                }
               
            };
        }
    },
    
    {
        name: "help",
        admin: false,
        login: false,
        description: "",
        handler: function(){
            outputToConsole("<br/>");
            outputToConsole("<i><font color='white'>To enter a command, type the command followed by its parameters and then hit enter. Do not include brackets ([]) when entering parameters.</font></i>");
            outputToConsole("<b>List of commands:</b>");
            for(var i = 0; i < COMMANDS.length; i++){
                if(COMMANDS[i].name == "help" || (COMMANDS[i].login == true && !loggedIn()) || (COMMANDS[i].admin == true && admin() == false))
                    continue;
                outputToConsole("&nbsp;&nbsp;&nbsp;&bull;<i>"+COMMANDS[i].name +COMMANDS[i].description+"</i>");
            }
            if(!loggedIn())
                outputToConsole("&nbsp;&nbsp;&nbsp;<i>Some commands are not shown. Log in to view them.</i>");
            outputToConsole("<br/>");
        }
    },
    {
        name: "startx",
        admin: false,
        login: false,
        description: ": switch to GUI interface",
        handler: function(){
            outputToConsole("Switching to GUI...");
            setTimeout(function(){doEasy(true, true);}, 1000);
        }
    },
    {
        name: "lin",
        admin: false,
        login: false,
        description: ": query whether or not you are logged in",
        handler: function(){
            if(loggedIn()){
                outputToConsole("You are logged in as <font color='yellow'>"+usr+"</font>.");
            } else {
                outputToConsole("You are not logged in.");
            }
        }
    },
    {
        name: "clear",
        admin: false,
        login: false,
        description: ": clear the console",
        handler: function(){
            document.getElementById('out').innerHTML = "";
            outputToConsole("Welcome to Water Gun Wars v2.0.1.4");
            outputToConsole("For a list of commands type 'help' and then enter.");
        }
    },
    {
        name: "who",
        admin: false,
        login: true,
        description: ": returns your current target",
        handler: function(){
        	if(kia()) return;
        	var target = get("target");
           outputToConsole(usr+ ", your target is <font color='yellow'>"+ target + "</font>");
        }
    },
    {
        name: "percent",
        admin: false,
        login: true,
        description: ": returns the percentage of alive agents",
        handler: function(){
        	if(kia()) return;
        	ajax.open("POST", "login.php", true);
            ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
            ajax.send("a=percent");
            ajax.onreadystatechange = function(){
                if(ajax.readyState == 4 && ajax.status == 200){
                    outputToConsole(ajax.responseText);
                    ajax.onreadystatechange = null;
                }
               
            };
        }
    },
    {
        name: "confirm_kill",
        admin: false,
        login: true,
        description: ": confirm kill on target. The target will have to confirm his/her death with the '<b>kia</b>' command",
        handler: function(){
            if(disputing() || kia()) return;
            conf();
        }
    },
     {
        name: "kia",
        admin: false,
        login: true,
        description: ": you've been killed in action",
        handler: function(){
        	if(kia()) return;
            kill();
        }
    },
    {
        name: "add",
        admin: true,
        login: true,
        description: " [codename] [first_name] [last_name] [cell_num] [carrier] : adds a new player to the database. A password will be generated and sent to their cell phone. Type 'carriers' for a list of carriers.",
        handler: function(args){
            if(admin()){
                if(args.length <= 1){
                    outputToConsole("<font color='yellow'>Command arguments not entered properly. Use as '<i>add [player codename] [first name] [last name] [telephone] [carrier]</i>'</font>");
                    return;
                }
                ajax.open("POST", "login.php", true);
                ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
                ajax.send("cname="+args[0]+"&rname="+args[1]+" "+args[2]+"&tel="+args[3]+"&carrier="+args[4]+"&a=insert");
                ajax.onreadystatechange = function(){
                    if(ajax.readyState == 4 && ajax.status == 200){
                        outputToConsole(ajax.responseText);
                        ajax.onreadystatechange = null;
                    }
                   
                };
            }
        }
    },
    {
        name: "carriers",
        admin: true,
        login: true,
        description: " list the available carriers.",
        handler: function(){
            var c = get_carriers();
            for (var i = c.length - 1; i >= 0; i--){
                outputToConsole(c[i]);
            }
        }
    },
    {
        name: "list",
        admin: true,
        login: true,
        description: ": list all players. Optional sort arguments [code|real|tel|pass|alive] [asc|desc]. Example </i>list tel desc<i>. By default, the sort method is 'desc'.",
        handler: function(sort){
            var s = "code_name";
            if(sort.length > 0) s = sort[0];
            var o = "desc";
            if(sort.length > 1) o = sort[1];
            ajax.open("POST", "login.php", true);
            ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
            ajax.send("a=playerlist&sort="+s+"&ord="+o);
            ajax.onreadystatechange = function(){
                if(ajax.readyState == 4 && ajax.status == 200){
                    outputToConsole(ajax.responseText);
                    ajax.onreadystatechange = null;
                }
            };
        }
    },
    {
        name: "distribute_targets",
        admin: true,
        login: true,
        description: ": Distributes the targets",
        handler: function(){
            ajax.open("POST", "login.php", true);
            ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
            ajax.send("a=dist");
            ajax.onreadystatechange = function(){
                if(ajax.readyState == 4 && ajax.status == 200){
                    outputToConsole(ajax.responseText);
                    ajax.onreadystatechange = null;
                }
               
            };
        }
    },
    {
        name: "notif",
        admin: true,
        login: true,
        description: ": list notifications",
        handler: function(){
            loadNotifications();
        }
    },
    {
        name: "self_defense",
        admin: true,
        login: true,
        description: "[codename]: do a self-defense kill for <i>codename</i>",
        handler: function(args){
           	ajax.open("POST", "login.php", true);
            ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
            ajax.send("a=self_defense&player="+args[0]);
            ajax.onreadystatechange = function(){
                if(ajax.readyState == 4 && ajax.status == 200){
                    outputToConsole(ajax.responseText);
                    ajax.onreadystatechange = null;
                }
               
            };
        }
    },
];

function processCommand() {
    var inField = $("#in");
    var input = inField.val();
    if(input == "") return;
    var parts = input.replace(/\s+/g, " ").split(" ");
    var command = parts[0];
	if(command != "login" && !gameStarted() && !admin()) {
		outputToConsole("<font color='red'>The game hasn't started just yet. Be patient!</font>");
		return;
	}
	if(command != "login" && inactive()){
		outputToConsole("<font color='yellow'>You've been inactive for seven days. You are out.</font>");
		return;
	}
    var args = parts.length > 1 ? parts.slice(1, parts.length) : [];
    inField.val("");
    prev[prevInd+1] = input;
    prevInd = prev.length-1;
    for (var i = 0; i < COMMANDS.length; i++) {
        if (command === COMMANDS[i].name) {
            if(COMMANDS[i].admin == true && !admin()) return;
            if(COMMANDS[i].login == true && !loggedIn()) return;
            COMMANDS[i].handler(args);
            return;
        }
    }
    outputToConsole("Unrecognized command: " + command);
    setfocus('in');
}

$(document).ready(
	function(){
		if(easy != isEasy()) {
            doEasy(false, true);
        }
        if(loggedIn()) {
            doLoginStuff();
            outputToConsole("<i><font color='white'>More commands are available since you're logged in. Type 'help' and then enter to view the new commands.<font></i>");
        }
        
        if(!isMobile.any()){
            $("#usr").css('width','50%');
            $("#pass").css('width','50%');
        }
        outputToConsole("Welcome to Water Gun Wars v2.0.1.4");
        outputToConsole("For a list of commands type 'help' and then enter. Some actions may not be available on the console but all are on the GUI.");
        setfocus('in', true);
        
        $("#in").bind('keydown',function(e){
        	if(e.keyCode == 13)
        		processCommand();
    		else if(e.keyCode == 38)
    			lastCommand();
			else if(e.keyCode == 40){
				prevInd = Math.min(prev.length-1, prevInd + 2);
				lastCommand();
			}
        });
        
        loadNotifications();
	}
);