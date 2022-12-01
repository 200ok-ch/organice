(use-modules (guix inferior)
             (guix channels)
             (srfi srfi-1))

(define channels
  (list (channel
         (name 'guix)
         (url "https://git.savannah.gnu.org/git/guix.git")
         (commit
          "d4ec49d1dab952478501349b9eace0f7f7dfaecd"))))

(define inferior
  (inferior-for-channels channels))

(packages->manifest
 (list (first (lookup-inferior-packages inferior "node"))
       (specification->package "make")
       (specification->package "bash")
       (specification->package "findutils") ;; xargs, find
       (specification->package "coreutils")
       (specification->package "grep")))
