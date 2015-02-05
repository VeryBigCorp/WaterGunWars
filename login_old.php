<?php
    session_start();
    $con = mysql_connect("localhost", "", "");
    mysql_select_db("wgw");

    $carriers = array(
            "verizon" => "vtext.com",
            "att" => "txt.att.net",
            "boost"=>"myboostmobile.com",
            "tmobile" => "tmomail.net",
            "virgin" => "vmobl.com",
            "sprint" => "messaging.sprintpcs.com",
            "straight_talk" => "vtext.com",
            "metropcs" => "mymetropcs.com",
    );
    if($_POST['a'] == "login"){
        fix_inactivity();
        $u = mysql_real_escape_string($_POST['u']);
        $p = mysql_real_escape_string($_POST['p']);

        $q = sprintf("SELECT password, admin FROM agent WHERE password='%s'",$p);
        $res = mysql_query($q, $con);
        if(mysql_num_rows($res) == 1){
            $r = mysql_fetch_assoc($res);
            if($r['password'] == $p){
                echo "Access granted.";
               $_SESSION['loggedin'] = true;
               $_SESSION['usr'] = $u;
               $_SESSION['admin'] = $r['admin'];
            } else {
                echo "unauthorized";
            }
        } else {
            echo "unauthorized";
        }
        mysql_free_result($res);
    } else if($_POST['a'] == "logout"){
        fix_inactivity();
        session_unset();
		session_destroy();
        echo "Logged out.";
    } else if($_POST['a'] == "verifylogin"){
        if($_SESSION['loggedin'] == true){
            echo "1";
        } else{
            echo "0";
        }
    } else if($_POST['a'] == "isadmin"){
        echo $_SESSION['admin'];
    } else if($_POST['a'] == "get_usr"){
        echo $_SESSION['usr'];
    } else if($_POST['a'] == "insert"){
        $codename = $_POST['cname'];
        if(!test_codename($codename)){
            echo "<font color='red'>Codename taken! Player not entered.</font>";
            return;
        }

        $real = $_POST['rname'];
        $tel = $_POST['tel'];
		$carrier = $_POST['carrier'];
        $pass = gen_pass();
        $s = "INSERT INTO agent (real_name, code_name, password, tel, carrier, kia, admin, prompt, last_kill) VALUES ('%s', '%s', '%s', '%s','%s', 0, 0, 0, '2014-04-14')";
        $q = sprintf($s, mysql_real_escape_string($real), mysql_real_escape_string($codename), $pass, mysql_real_escape_string($tel), mysql_real_escape_string($carrier));
        $r = mysql_query($q, $con);
        $q = "SELECT * FROM agent WHERE code_name='".mysql_real_escape_string($codename)."'";
        $r = mysql_query($q, $con);
        while($row = mysql_fetch_assoc($r)){
            $str = "Added new player [#" . $row['id'] . "]<br/>Codename: " . $row['code_name'] . "<br/>Name: " . $row['real_name'] . "<br/>Password: " . $row['password']. "<br/>Cell: " . $row['tel'];
            echo $str;
            send_sms($row['tel'], $row['carrier'], $row['code_name'] . ", you've been added to the game. Once the game starts you will get another message containing your target.");
            send_sms($row['tel'], $row['carrier'], "To log into the website at waterwars.tk, use the code ".$row['password'].".");
        }
    } else if($_POST['a'] == "interfaceMode"){
    	if(!isset($_SESSION['easy'])) $_SESSION['easy'] = "easy";
        echo $_SESSION['easy'];
    } else if($_POST['a'] == "changemode"){
        $_SESSION['easy'] = $_POST['m'];
    } else if($_POST['a'] == "get"){
        $res = $_POST['g'];
        if($res == "target"){
            echo get_target_real($_SESSION['usr']);
            return;
        }
        $q = mysql_query("SELECT $res FROM agent WHERE code_name='".mysql_real_escape_string($_SESSION['usr'])."'");
        if(mysql_num_rows($q)==1){
            $r = mysql_fetch_assoc($q);
            echo $r[$res];
        }
    } else if($_POST['a'] == "playerlist"){
        $sort = $_POST['sort'];
        $order = strtoupper($_POST['ord']);
        if($sort == "real")
            $sort = "real_name";
        else if($sort == "pass")
            $sort = "password";
        else if($sort == "alive")
            $sort = "kia";
        else if($sort == "code")
            $sort = "code_name";
        $r = mysql_query("SELECT * FROM agent ORDER BY $sort $order");
        echo "<br/>List of players (" . (mysql_num_rows($r)-2) . "):<br/>";
        echo "<style>td {padding:5px;}</style><table width='100%'><tr style='text-align:left;'><td>Codename</td><td>Real Name</td><td>Target</td><td>Telephone</td><td>Password</td><td>Alive</td></tr>";
        $i = 0;
        while($row = mysql_fetch_assoc($r)){
            $col = "gray";
            if($i % 2 == 0) $col = "black";
            echo "<tr style='background-color:$col;color:white; padding:1em;'>";
            echo "<td>";
            echo $row['code_name'];
            echo "</td>";
            echo "<td>";
            echo $row['real_name'];
            echo "</td>";
            echo "<td>";
            echo $row['target'];
            echo "</td>";
            echo "<td>";
            echo $row['tel'];
            echo "</td>";
            echo "<td>";
            echo $row['password'];
            echo "</td>";
            $color = "red";
            if($row['kia'] == 0)
                $color = "green";
            echo "<td style='background-color:$color;'></td>";
            echo "</tr>";
            $i++;
        }
        echo "</table>";
		echo "<br/>";
		mysql_free_result($r);
    } else if($_POST['a'] == "dist"){
        echo "Distributing...";
        $q = mysql_query("select tel, carrier, code_name, password from agent");
        while($row = mysql_fetch_assoc($q)){
            send_sms($row['tel'], $row['carrier'], $row['code_name'] . ", to log into the website at waterwars.tk, use the code ".$row['password'].".");
        }
        dist_targets();
        echo "Distributed.";
    } else if($_POST['a'] == "confirm"){
        add_notif($_SESSION['usr'], "CONF","<font color='yellow'>".get_real($_SESSION['usr'])."</font> confirmed a kill on <font color='yellow'>".get_real(get_target($_SESSION['usr']))."</font> Click this notification to respond.");
        mysql_query("UPDATE agent SET prompt=true WHERE code_name='".get_target($_SESSION['usr'])."'");
        send_sms(get("tel", get_target($_SESSION['usr'])), get("carrier", get_target($_SESSION['usr'])), "An agent confirmed a kill on you. Log in to the website to dispute or confirm it.");
        echo "Confirmed.";
    } else if($_POST['a'] == "kia"){
        add_notif($_SESSION['usr'], "KIAA","<font color='yellow'>".get_real($_SESSION['usr'])."</font> confirmed a kill by <font color='yellow'>".get_real(get_killer($_SESSION['usr']))."</font>");
        mysql_query("DELETE FROM notif WHERE user='".get_killer($_SESSION['user'])."'");
        mysql_query("UPDATE agent SET kia=true, dispute=false, prompt=false, killer='".get_killer($_SESSION['usr'])."' WHERE code_name='".$_SESSION['usr']."'");
        dist_targets();
    } else if($_POST['a'] == "prompting"){
        $q = mysql_fetch_assoc(mysql_query("SELECT prompt FROM agent WHERE code_name='".get_target($_SESSION['usr'])."'"));
        echo $q['prompt'] == true ? "1" : "0";
    } else if($_POST['a'] == "notif"){
        $q = mysql_query("SELECT * FROM notif ORDER BY id DESC");
        if(mysql_num_rows($q) == 0)
            echo "<br/>&nbsp;&nbsp;&nbsp;<i>No notifications.</i>";
        while($row = mysql_fetch_assoc($q)){
            if($row['type'] == "DISP"){
                echo "<br/>&nbsp;&nbsp;&nbsp;&bull; " . $row['text']." <a style='text-decoration:underline;' onclick=\"disp(".$row['id'].",true);\">Killer Wins</a> or <a style='text-decoration:underline;' onclick=\"disp(".$row['id'].",false);\">Victim wins</a>";
            } else {
                echo "<br/>&nbsp;&nbsp;&nbsp;&bull;<a onclick=\"notif(".$row['id'].",'".$row['type']."');\">".$row['text']."</a>";
            }
        }
    } else if($_POST['a'] == "resolveNotif"){
        $id = $_POST['id'];
        $q = mysql_fetch_assoc(mysql_query("SELECT * FROM notif WHERE id=$id"));
        if($q['type'] == "CONF"){
            mysql_query("DELETE FROM notif WHERE user='".$_SESSION['user']."'");
            mysql_query("UPDATE agent SET kia=true, prompt=false, killer='".$q['usr']."' WHERE code_name='".get_target($q['user'])."'");
            dist_targets();
            echo "Confirmed.";
        } else if($q['type'] == "DISP"){
            if($_POST['yes'] == "true"){
                send_sms(get_tel($q['user']), get_carrier($q['user']),"The moderator sided with the killer in the dispute. You were killed by ".get_killer($q['user']));
                send_sms(get_tel(get_killer($q['user'])), get_carrier(get_killer($q['user'])),"The moderator sided with you in the dispute. Your target is dead.");

                $killer = get_killer($q['user']);
                mysql_query(sprintf("UPDATE agent SET prompt=false, kia=true, killer='%s' WHERE code_name='%s'", mysql_real_escape_string($killer), mysql_real_escape_string($q['user'])));
                mysql_query("UPDATE agent SET dispute=false WHERE code_name='".$killer."'");
                dist_targets();
            } else {
                mysql_query(sprintf("UPDATE agent SET dispute=false WHERE code_name='%s'", mysql_real_escape_string(get_killer($q['user']))));
                mysql_query("UPDATE agent SET prompt=false WHERE code_name='%s'", mysql_real_escape_string($q['user']));
                send_sms(get_tel($q['user']), get_carrier($q['user']),"The moderator decided that the dispute was valid. You are still alive. Tread carefully.");
                send_sms(get_tel(get_killer($q['user'])), get_carrier(get_killer($q['user'])),"The moderator sided with your target in the decision. You must attempt again.");
            }
        }
        mysql_query("DELETE FROM notif WHERE id=$id");
    } else if($_POST['a'] == "dispute"){
        add_notif($_SESSION['usr'], "DISP", "<font color='yellow'>".get_real($_SESSION['usr'])."</font> disputed a kill by <font color='yellow'>".get_real(get_killer($_SESSION['usr'])).".</font>");
        mysql_query("UPDATE agent SET dispute=true WHERE code_name='".get_killer($_SESSION['usr']) . "'");
        send_sms(get_tel(get_killer($_SESSION['usr'])), get_carrier(get_killer($_SESSION['usr'])), "Your target disputed your kill. The moderator will review it.");
        send_sms(get_tel(get_admin()), get_carrier(get_admin()),get_real($_SESSION['usr'])." disputed a kill by ".get_real(get_killer($_SESSION['usr'])).".");
    } else if($_POST['a'] == "disputing"){
        $q = mysql_fetch_assoc(mysql_query("SELECT dispute FROM agent WHERE code_name='".get_killer($_SESSION['usr'])."'"));
        echo $q['dispute'];
    } else if($_POST['a'] == "started"){
        $q = mysql_query("SELECT target FROM agent WHERE target is null");
        echo mysql_num_rows($q) <= 2;
    } else if($_POST['a'] == "mass"){
        $text = trim($_POST['text']);
        if(strlen($text) == 0) return;
        $strings = str_split($text, 155);
        $arr = array();
        $q = mysql_query("SELECT tel, carrier FROM agent");
        while($r = mysql_fetch_assoc($q)){
            $arr[$r['tel']] = $r['carrier'];
        }
        foreach($strings as $msg){
            foreach($arr as $tel => $carrier)
                send_sms($tel,$carrier,$msg);
        }
    } else if($_POST['a'] == "getcarriers"){
        echo json_encode(array_reverse(array_keys($carriers)));
    } else if($_POST['a'] == "self_defense"){
        add_notif($_SESSION['usr'], "DEFN","<font color='yellow'>".get_real($_SESSION['usr'])."</font> confirmed a self defense kill on <font color='yellow'>".get_real(get_killer($_SESSION['usr']))."</font>");
        mysql_query("UPDATE agent SET self_defense_prompt=true WHERE code_name='".get_killer($_SESSION['usr'])."'");
        send_sms(get_tel(get_admin()), get_carrier(get_admin()),"<font color='yellow'>".get_real($_SESSION['usr'])."</font> confirmed a self defense kill on <font color='yellow'>".get_real(get_killer($_SESSION['usr']))."</font>");
    } else if($_POST['a'] == "promptingSelfDefense"){
        $r = mysql_fetch_assoc(mysql_query("SELECT self_defense_prompt FROM agent WHERE code_name='" . $_SESSION['usr'] . "'"));
        return $r['self_defense_prompt'] == true;
    }
    mysql_close();

    function dist_targets(){
        $targets = array();
        $q = mysql_query("SELECT code_name, kia, real_name, admin, inactive FROM agent");
        $i = 0;
        while($r = mysql_fetch_assoc($q)){
            if($r['kia'] == true) {
                mysql_query("UPDATE agent SET target=null WHERE code_name='".$r['code_name']."'");
                continue;
            }
            if($r['admin'] == true)
                continue;
            if($r['inactive'] == true)
                continue;
            $targets[] = $r['code_name'];
        }
        for($i = 0; $i < count($targets); $i++){
            $target = $targets[($i+2)% count($targets)];
           $q = mysql_fetch_assoc(mysql_query("SELECT tel, carrier, target FROM agent WHERE code_name='".$target."'"));
           if($q['target'] != $targets[$i])
               send_sms($q['tel'],$q['carrier']," you've been assigned a new target, ". get_real($targets[$i]).".");
            mysql_query("UPDATE agent SET target='$targets[$i]' WHERE code_name='".$target."'");
        }
    }

    function get_killer($usr){
        $q = mysql_fetch_assoc(mysql_query("SELECT code_name FROM agent WHERE target='$usr'"));
        return $q['code_name'];
    }

    function get_real($codename){
        $q = mysql_fetch_assoc(mysql_query("SELECT real_name FROM agent WHERE code_name='$codename'"));
        return $q['real_name'];
    }

    function get_target($usr){
        $q = mysql_fetch_assoc(mysql_query("SELECT target FROM agent WHERE code_name='$usr'"));
        return $q['target'];
    }

    function get_target_real($usr){
        return get_real(get_target($usr));
    }

    function get($val, $usr){
        $q = mysql_query("SELECT $val FROM agent WHERE code_name='".mysql_real_escape_string($usr)."'");
        if(mysql_num_rows($q)==1){
            $r = mysql_fetch_assoc($q);
            return $r[$val];
        }
    }

    function get_admin(){
        return "SharkManlinsky";
    }

    /**
     * Returns true if codename is available
     */
    function test_codename($c){
        $q = mysql_query("SELECT code_name FROM agent WHERE code_name='$c'");
        return mysql_num_rows($q) == 0;
    }
    /**
     * CONF: the killer confirmed a kill
     * KIA: the target confirmed a kill
     * DISP: disputed kill
     */
    function add_notif($usr, $type, $message){
        mysql_query(sprintf("INSERT INTO notif (type, text, user) VALUES ('%s','%s', '%s')",mysql_escape_string($type), mysql_escape_string($message), mysql_escape_string($usr)));
    }

    function gen_pass(){
        $characters = "0123456789abcdefghijklmnopqrstuvwxyz";
        $pass = "";
        for($i = 0; $i < 5; $i++)
            $pass .= $characters[rand(0, strlen($characters)-1)];
        return $pass;
    }


	function send_sms($num, $carrier, $msg){
	    $carriers = array(
            "verizon" => "vtext.com",
            "att" => "txt.att.net",
            "boost"=>"myboostmobile.com",
            "tmobile" => "tmomail.net",
            "virgin" => "vmobl.com",
            "sprint" => "messaging.sprintpcs.com",
            "straight_talk" => "vtext.com",
            "metropcs" => "mymetropcs.com",
        );
        foreach($carriers as $c => $m){
            mail($num . "@" . $m, "", $msg,  "From: Water Wars>\r\n");
        }
	}

    function get_tel($usr){
        $q = mysql_fetch_assoc(mysql_query("SELECT tel FROM agent WHERE code_name='$usr'"));
        return $q['tel'];
    }

    function get_carrier($usr){
        $q = mysql_fetch_assoc(mysql_query("SELECT carrier FROM agent WHERE code_name='$usr'"));
        return $q['carrier'];
    }

    function fix_inactivity(){
        mysql_query("update agent set inactive=true where last_kill <= NOW() - interval 8 day");
        $q = mysql_query("select tel, carrier, sent_inactivity, code_name from agent where inactive=true");
        while($r = mysql_fetch_assoc($q)){
            if(!$r['sent_inactivity'])
                send_sms($r['tel'], $r['carrier'], "You've been inactive for seven days. You are now out of the game.");
            mysql_query("update agent set sent_inactivity=true WHERE code_name='$r[code_name]'");
        }
    }
?>
