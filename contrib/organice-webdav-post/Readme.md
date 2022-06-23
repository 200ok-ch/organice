* Receive an HTTP post with a message to post to an Org file in organice

These scripts *directly* update Org files on your WebDAV server.  You can use this script directly from your web browser or through automation tools (such as Mailgun or IFTTT) to post tasks directly to Org files.

*NOTES*:
  - This set of scripts was designed to be modular and used
  - There is limited content checking - so please be careful with what you post
  - Watch out for race conditions if you edit your Org files in multiple places simultaneously
  - The =organice_inbox.sh= script assumes a deadline of today for convenience

** Configuring the scripts

In this example, the file =home.php= contains all of the configuration information.  There should be no reason to edit the other files, unless you wish to change some default behaviours.

The file =inbox.php= does the actual parsing of the web traffic.  You can create multiple =home.php= files - each with different configurations - and they can all include =inbox.php= safely to get incoming tasks processed.

** Enabling the script

You should put the file =organice-inbox.sh= in a directoory *outside* of the directories of your web server.  The script must be executable by the same user that runs your web-server.  This user must also have write access to the Org file  where the task will be captured.

** Using the script

Once you have these scripts properly configured and added to your web-server, you can use them directly in a browser or POST data to be immediately added.  For this example, let's assume the URL of https://my.organice.org/home.php

Loading this URL in a browser will present an HTML form where you can add a task with a title and description.

You can also POST content to the URL to automatically add a task to Organice without further confirmation.  For POSTing data, the following fields are used:
- *Subject* _(required)_ - the title of the task to be included in the headline
- *body-plain* _(optional)_ - additional text to be included in the description of the task
- *token* _(optional)_ - if you wish to pass a token to be authenticate requests later (*NOTE:* Validating the token is not currently in this script)
- *bookmarklet* _(optional)_ - setting any value here will tell the script that it was called from a bookmarklet popup - and the link button after inserting a task will cause the popup to close
- *voice* _(optional)_ - setting any value here will tell the script that it was called from a voice command - so you have a way to customize the response to be read back by Siri, Google Assistant or another voice assistant
