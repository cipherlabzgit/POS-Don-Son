; Common (all-users) Startup:
; C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp
!macro customInstall
  ReadEnvStr $R9 "ProgramData"
  StrCmp $R9 "" 0 +2
    StrCpy $R9 "C:\ProgramData"
  CreateDirectory "$R9\Microsoft\Windows\Start Menu\Programs\StartUp"
  SetOutPath "$INSTDIR"
  CreateShortCut "$R9\Microsoft\Windows\Start Menu\Programs\StartUp\${PRODUCT_FILENAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\resources\icon.ico" 0
!macroend

!macro customUnInstall
  ReadEnvStr $R9 "ProgramData"
  StrCmp $R9 "" 0 +2
    StrCpy $R9 "C:\ProgramData"
  Delete "$R9\Microsoft\Windows\Start Menu\Programs\StartUp\${PRODUCT_FILENAME}.lnk"
!macroend
