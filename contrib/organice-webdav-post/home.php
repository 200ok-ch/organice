<?php
   //This file configures a web-hook receiver for Organice tasks
   //   NOTE: You could include these files at the top of 'inbox.php' if you don't want multiple scripts
   //         but you will lose the option to have multiple different input paths
   $html = basename(__FILE__);
   $json = "/tmp/home-inbox.json";  //Used for some debugging output
   $txt = "/tmp/home-inbox.txt";    //Used for some debugging output
   $log = "/tmp/home-inbox.log";    //Used for some debugging output
   $title = "Home";                 //The text that appears on the task form
   $icon = "/my_icon.gif"; //The URL of the icon to be used for adding mobile bookmarks, favicon, etc.....
   $organice_file = "/organice/documents/home-inbox.org";       //The Org file to append the incoming to
   $organice_url = "https://my.organice.org/";                  //The URL of your Organice instance - used for creating links

   $script = "/scripts/organice_inbox.sh";                      //Script to actually post the content
   require_once("inbox.php");                                   //Include the script that actually does the work
?>
