# CI předloha

`ci.yml` patří do `.github/workflows/ci.yml`, ale fine-grained token denní session nemá oprávnění `workflow`, takže ho nemůže pushnout. Michale: buď přidej tokenu oprávnění **Workflows: Read and write**, nebo soubor přesuň ručně. Pak lze tuto složku smazat.
