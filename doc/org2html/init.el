(add-to-list 'load-path (file-name-directory load-file-name))
(require 'htmlize)
(load-library "tramp-gvfs")
(setq tramp-gvfs-enabled t)
(require 'org)
(org-babel-do-load-languages
 'org-babel-load-languages
 '((shell . t)
   (emacs-lisp . t)))

;; Don’t ask to execute a code block.
(setq org-confirm-babel-evaluate nil)
