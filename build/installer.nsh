!macro customInstall
  ${if} ${FileExists} "$INSTDIR\星图远征.ico"
    !ifndef DO_NOT_CREATE_START_MENU_SHORTCUT
      Delete "$newStartMenuLink"
      CreateShortCut "$newStartMenuLink" "$appExe" "" "$INSTDIR\星图远征.ico" 0 "" "" "${APP_DESCRIPTION}"
      ClearErrors
      WinShell::SetLnkAUMI "$newStartMenuLink" "${APP_ID}"
    !endif

    !ifndef DO_NOT_CREATE_DESKTOP_SHORTCUT
      ${ifNot} ${isNoDesktopShortcut}
        Delete "$newDesktopLink"
        CreateShortCut "$newDesktopLink" "$appExe" "" "$INSTDIR\星图远征.ico" 0 "" "" "${APP_DESCRIPTION}"
        ClearErrors
        WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
      ${endIf}
    !endif

    System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
  ${endIf}
!macroend
