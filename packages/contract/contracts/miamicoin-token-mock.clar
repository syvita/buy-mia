(define-constant ERR_UNAUTHORIZED u2000)

(define-fungible-token miamicoin)

(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq from tx-sender) (err ERR_UNAUTHORIZED))
    (if (is-some memo)
      (print memo)
      none
    )
    (ft-transfer? miamicoin amount from to)
  )
)

(define-read-only (get-balance (user principal))
  (ok (ft-get-balance miamicoin user))
)

;; used only during tests
(define-public (test-mint (amount uint) (recipient principal))
  (ft-mint? miamicoin amount recipient)
)