<?php
   //Make sure that some variables are cleared properly
   $subject = "";
   $description = "";

   //required variables set in calling PHP script $json, $text, $script, $icon, $title, $organice_file, $organice_url

   if ($_SERVER['REQUEST_METHOD'] == "GET") { //Display a form to get input - if nothing was sent
?>
     <head>
     <link rel="shortcut icon" type="image/x-icon" href="<?php echo $icon; ?>">
     <meta name="viewport" content="width=device-width, initial-scale=2, minimum-scale=1, maximum-scale=2, user-scalable=0">
     <title><?php echo $title; ?> task - Organice</title>
     </head>

     <form action="<?php echo $html . '?token=' . $_REQUEST['token']; ?>" method="POST" autocomplete="off">
     <input type="hidden" name="bookmarklet" value="<?php if (isset($_REQUEST['bookmarklet'])) { echo $_REQUEST['bookmarklet']; } ?>">
     Task title: <input autofocus type="text" name="Subject" size="70"><p>
     Task description:<br>
     <textarea id="body-plain" name="body-plain" rows="4" cols="80" autofocus></textarea><p>
     <input type="submit" value="Add task">
     </form>

<?php
   }

   if ($_SERVER['REQUEST_METHOD'] == "POST") {

      $cmd = $script . ' "' .
             escapeshellarg($_POST["Subject"]) . '" "' .
             escapeshellarg($_POST["body-plain"]) . '" ' .
             $organice_file;

      system($cmd);
      file_put_contents($log, $cmd . " ---- " . $_POST["Subject"] . " ---- " . $_POST["body-plain"]);

      $navigation = false;
      $bookmarklet = false;

      if (isset($_REQUEST['bookmarklet'])) {
         if ($_REQUEST['bookmarklet'] == '1') {
            echo '<p><a href="javascript:window.close();">Close popup</a>';
            $navigation = true;
         }
      }

      $voice = false;
      if (isset($_REQUEST['voice'])) {
         if ($_REQUEST['voice'] == "yes") {
            $voice = true;
         }
      }

      if ( (!$navigation) && (!$voice) ) {
         echo '<p><a href="' . $html . '">Add another task</a>';
      }
   }
?>
