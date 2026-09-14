param(
    [Parameter(Mandatory=$true)][string]$Type,
    [Parameter(Mandatory=$true)][string]$InputPath,
    [Parameter(Mandatory=$true)][string]$OutputPath
)

$ErrorActionPreference = "Stop"

$resolvedInput = [System.IO.Path]::GetFullPath($InputPath)
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)

if (-not (Test-Path $resolvedInput)) {
    Write-Error "Input file does not exist: $resolvedInput"
    exit 1
}

$comApp = $null
$comDoc = $null

try {
    if ($Type -eq "word") {
        $comApp = New-Object -ComObject Word.Application
        $comApp.DisplayAlerts = 0
        $comApp.Visible = $false
        # Open(FileName, ConfirmConversions, ReadOnly, AddToRecentFiles)
        $comDoc = $comApp.Documents.Open($resolvedInput, $false, $true, $false)
        # wdExportFormatPDF = 17
        try {
            $comDoc.ExportAsFixedFormat($resolvedOutput, 17)
        } catch {
            $comDoc.SaveAs([ref]$resolvedOutput, [ref]17)
        }
        Write-Output "SUCCESS"
    } elseif ($Type -eq "powerpoint") {
        $comApp = New-Object -ComObject PowerPoint.Application
        # Open read-only, untitled=false, withWindow=false
        $comDoc = $comApp.Presentations.Open($resolvedInput, -1, 0, 0)
        # ppSaveAsPDF = 32
        $comDoc.SaveAs($resolvedOutput, 32)
        Write-Output "SUCCESS"
    } elseif ($Type -eq "excel") {
        $comApp = New-Object -ComObject Excel.Application
        $comApp.DisplayAlerts = $false
        $comDoc = $comApp.Workbooks.Open($resolvedInput)
        # xlTypePDF = 0 (exports all active worksheets into PDF)
        $comDoc.ExportAsFixedFormat(0, $resolvedOutput)
        Write-Output "SUCCESS"
    } else {
        throw "Unsupported application type: $Type"
    }
} catch {
    $errMsg = $_.Exception.Message
    if ($errMsg -match "password" -or $errMsg -match "protected" -or $errMsg -match "encrypted" -or $errMsg -match "Kennwort" -or $errMsg -match "Passwort") {
        Write-Output "PASSWORD_PROTECTED: This document is password protected and cannot be converted."
        exit 2
    }
    Write-Error "$errMsg"
    exit 1
} finally {
    if ($comDoc -ne $null) {
        try {
            if ($Type -eq "powerpoint") {
                $comDoc.Close()
            } elseif ($Type -eq "word") {
                $comDoc.Close([ref]0) # wdDoNotSaveChanges = 0
            } else {
                $comDoc.Close($false)
            }
        } catch {}
        try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($comDoc) | Out-Null } catch {}
    }
    if ($comApp -ne $null) {
        try { $comApp.Quit() } catch {}
        try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($comApp) | Out-Null } catch {}
    }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
